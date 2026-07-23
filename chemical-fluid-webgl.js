/* ==========================================================================
   CHEMICAL FLUID v2 — "Búsqueda en el líquido revelador"
   ========================================================================== */

class ChemicalFluidSim {
    constructor(canvas, opts = {}) {
        this.canvas = canvas;
        this.isActive = typeof opts.isActive === 'function' ? opts.isActive : () => true;
        this.getSize = typeof opts.getSize === 'function'
            ? opts.getSize
            : () => ({ width: canvas.clientWidth || window.innerWidth, height: canvas.clientHeight || window.innerHeight });
        this.onPondRevealed = typeof opts.onPondRevealed === 'function' ? opts.onPondRevealed : () => {};
        this.onPondUpdate = typeof opts.onPondUpdate === 'function' ? opts.onPondUpdate : () => {};

        const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const lowMem = (navigator.deviceMemory || 4) <= 4;
        this.isMobile = coarsePointer || lowMem || /iPhone|Android/i.test(navigator.userAgent);

        this.config = {
            SIM_RESOLUTION: this.isMobile ? 96 : 128,
            DYE_RESOLUTION: this.isMobile ? 384 : 512,
            WIPE_DISSIPATION: 0.95,       // (MÁS BAJO) El rastro visual se cierra más rápido
            VELOCITY_DISSIPATION: 0.98,
            PRESSURE_DISSIPATION: 0.8,
            PRESSURE_ITERATIONS: this.isMobile ? 14 : 22,
            CURL: this.isMobile ? 20 : 30,
            SPLAT_RADIUS_PX: this.isMobile ? 10 : 14, // Pincel más fino, cuesta más
            SPLAT_FORCE: 2800,                        // Menos fuerza al agitar
            BASE_OPACITY: 0.96,
            MAX_PONDS: 4,
            POND_GRID_SIZE: 7,
            CELL_CLEAR_THRESHOLD: 0.65,               // Tienes que limpiar bien cada celda
            REVEAL_FRACTION: 0.85,                    // Debes despejar el 85% de la foto
            POND_DECAY_PER_SEC: 0.95,                 // El líquido regresa rápido si dejas de frotar
            REVEAL_SHRINK_SECONDS: 1.1
        };

        this._lastTime = performance.now();
        this._rafId = null;
        this._pendingSplats = [];
        this.ponds = new Map();
        this.warmth = 0;

        this._initGL();
        if (!this.gl) return;

        this._compilePrograms();
        this._initFramebuffers();
        this._initBlit();
        this._resizeCanvas();

        window.addEventListener('resize', () => this._resizeCanvas());
        window.addEventListener('orientationchange', () => this._resizeCanvas());
    }

    setWarmth(val) {
        this.warmth = val;
    }

    isSupported() { return !!this.gl; }

    _initGL() {
        const params = { alpha: true, depth: false, stencil: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false };
        let gl = this.canvas.getContext('webgl', params) || this.canvas.getContext('experimental-webgl', params);
        if (!gl) { this.gl = null; return; }
        this.gl = gl;

        const halfFloat = gl.getExtension('OES_texture_half_float');
        gl.getExtension('OES_texture_half_float_linear');
        gl.getExtension('OES_texture_float');
        gl.getExtension('OES_texture_float_linear');
        gl.getExtension('WEBGL_color_buffer_float');
        gl.getExtension('EXT_color_buffer_half_float');

        this.HALF_FLOAT = halfFloat ? halfFloat.HALF_FLOAT_OES : null;
        this._texType = this._pickTextureType();
        this._supportsLinear = this._texType.linear;
    }

    _pickTextureType() {
        const gl = this.gl;
        const tryType = (type, linear) => {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, linear ? gl.LINEAR : gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, linear ? gl.LINEAR : gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, type, null);
            const fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.deleteFramebuffer(fbo);
            gl.deleteTexture(tex);
            return ok;
        };

        if (this.HALF_FLOAT && tryType(this.HALF_FLOAT, true)) {
            return { type: this.HALF_FLOAT, linear: !!this.gl.getExtension('OES_texture_half_float_linear') };
        }
        return { type: this.gl.UNSIGNED_BYTE, linear: true };
    }

    static get VERTEX_SHADER() {
        return `
            precision highp float;
            attribute vec2 aPosition;
            varying vec2 vUv;
            varying vec2 vL, vR, vT, vB;
            uniform vec2 texelSize;
            void main () {
                vUv = aPosition * 0.5 + 0.5;
                vL = vUv - vec2(texelSize.x, 0.0);
                vR = vUv + vec2(texelSize.x, 0.0);
                vT = vUv + vec2(0.0, texelSize.y);
                vB = vUv - vec2(0.0, texelSize.y);
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }`;
    }

    static get FRAG_CLEAR() {
        return `
            precision mediump float;
            varying vec2 vUv;
            uniform sampler2D uTexture;
            uniform float value;
            void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`;
    }

    static get FRAG_ADVECTION() {
        return `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uVelocity;
            uniform sampler2D uSource;
            uniform vec2 texelSize;
            uniform float dt;
            uniform float dissipation;
            void main () {
                vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
                gl_FragColor = texture2D(uSource, coord) * dissipation;
            }`;
    }

    static get FRAG_SPLAT() {
        return `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uTarget;
            uniform float aspectRatio;
            uniform vec3 value;
            uniform vec2 point;
            uniform float radius;
            void main () {
                vec2 p = vUv - point.xy;
                p.x *= aspectRatio;
                vec3 splat = exp(-dot(p, p) / radius) * value;
                vec3 base = texture2D(uTarget, vUv).xyz;
                gl_FragColor = vec4(base + splat, 1.0);
            }`;
    }

    static get FRAG_DIVERGENCE() {
        return `
            precision highp float;
            varying vec2 vUv, vL, vR, vT, vB;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uVelocity, vL).x;
                float R = texture2D(uVelocity, vR).x;
                float T = texture2D(uVelocity, vT).y;
                float B = texture2D(uVelocity, vB).y;
                vec2 c = texture2D(uVelocity, vUv).xy;
                if (vL.x < 0.0) { L = -c.x; }
                if (vR.x > 1.0) { R = -c.x; }
                if (vT.y > 1.0) { T = -c.y; }
                if (vB.y < 0.0) { B = -c.y; }
                float div = 0.5 * (R - L + T - B);
                gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
            }`;
    }

    static get FRAG_CURL() {
        return `
            precision highp float;
            varying vec2 vUv, vL, vR, vT, vB;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uVelocity, vL).y;
                float R = texture2D(uVelocity, vR).y;
                float T = texture2D(uVelocity, vT).x;
                float B = texture2D(uVelocity, vB).x;
                float vorticity = R - L - T + B;
                gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
            }`;
    }

    static get FRAG_VORTICITY() {
        return `
            precision highp float;
            varying vec2 vUv, vL, vR, vT, vB;
            uniform sampler2D uVelocity;
            uniform sampler2D uCurl;
            uniform float curlStrength;
            uniform float dt;
            void main () {
                float L = texture2D(uCurl, vL).x;
                float R = texture2D(uCurl, vR).x;
                float T = texture2D(uCurl, vT).x;
                float B = texture2D(uCurl, vB).x;
                float C = texture2D(uCurl, vUv).x;

                vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
                force /= length(force) + 0.0001;
                force *= curlStrength * C;
                force.y *= -1.0;

                vec2 vel = texture2D(uVelocity, vUv).xy;
                gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
            }`;
    }

    static get FRAG_PRESSURE() {
        return `
            precision highp float;
            varying vec2 vUv, vL, vR, vT, vB;
            uniform sampler2D uPressure;
            uniform sampler2D uDivergence;
            void main () {
                float L = texture2D(uPressure, vL).x;
                float R = texture2D(uPressure, vR).x;
                float T = texture2D(uPressure, vT).x;
                float B = texture2D(uPressure, vB).x;
                float divergence = texture2D(uDivergence, vUv).x;
                float pressure = (L + R + B + T - divergence) * 0.25;
                gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
            }`;
    }

    static get FRAG_GRADIENT_SUBTRACT() {
        return `
            precision highp float;
            varying vec2 vUv, vL, vR, vT, vB;
            uniform sampler2D uPressure;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uPressure, vL).x;
                float R = texture2D(uPressure, vR).x;
                float T = texture2D(uPressure, vT).x;
                float B = texture2D(uPressure, vB).x;
                vec2 vel = texture2D(uVelocity, vUv).xy;
                vel -= vec2(R - L, T - B);
                gl_FragColor = vec4(vel, 0.0, 1.0);
            }`;
    }

    static get FRAG_DISPLAY() {
    return `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uWipe;
        uniform sampler2D uCurl;
        uniform float aspectRatio;
        uniform float baseOpacity;
        uniform float uWarmth;

        void main () {
            // Muestreo suavizado (5 taps) para eliminar el aliasing/pixelado del borde del wipe
            vec2 texel = vec2(0.0022, 0.0022 * aspectRatio);
            float wipeSample =
                texture2D(uWipe, vUv).r * 2.0 +
                texture2D(uWipe, vUv + vec2(texel.x, 0.0)).r +
                texture2D(uWipe, vUv - vec2(texel.x, 0.0)).r +
                texture2D(uWipe, vUv + vec2(0.0, texel.y)).r +
                texture2D(uWipe, vUv - vec2(0.0, texel.y)).r;
            wipeSample /= 6.0;

            float wipe = smoothstep(0.0, 1.0, clamp(wipeSample, 0.0, 1.0));
            float curlMag = clamp(abs(texture2D(uCurl, vUv).r) * 0.06, 0.0, 1.0);

            vec2 c = vUv - vec2(0.5, 0.42);
            c.x *= aspectRatio;
            float g = 1.0 - clamp(length(c) * 1.6, 0.0, 1.0);
            
            // Colores base dinámicos sincronizados con el fondo
            vec3 darkRed = vec3(0.05, 0.015, 0.02);
            vec3 lightRed = vec3(0.42, 0.05, 0.06);
            vec3 darkWarm = vec3(0.08, 0.04, 0.01);
            vec3 lightWarm = vec3(0.55, 0.35, 0.08);

            float warmFactor = clamp(uWarmth * 2.1, 0.0, 1.0);
            vec3 cDark = mix(darkRed, darkWarm, warmFactor);
            vec3 cLight = mix(lightRed, lightWarm, warmFactor);

            vec3 base = mix(cDark, cLight, g);
            float edge = 4.0 * wipe * (1.0 - wipe);
            vec3 warmEdge = mix(vec3(0.78, 0.42, 0.10), vec3(0.90, 0.68, 0.22), curlMag);
            vec3 color = base + warmEdge * edge * (0.55 + curlMag);

            float alpha = baseOpacity * (1.0 - wipe);
            gl_FragColor = vec4(color, alpha);
        }`;
    }

    _compilePrograms() {
        const gl = this.gl;
        this._compileShader = (type, src) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.error('[ChemicalFluidSim] Shader error:', gl.getShaderInfoLog(s));
            }
            return s;
        };
        const link = (fsSrc) => {
            const vs = this._compileShader(gl.VERTEX_SHADER, ChemicalFluidSim.VERTEX_SHADER);
            const fs = this._compileShader(gl.FRAGMENT_SHADER, fsSrc);
            const prog = gl.createProgram();
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                console.error('[ChemicalFluidSim] Program link error:', gl.getProgramInfoLog(prog));
            }
            return this._wrapProgram(prog);
        };

        this.programs = {
            clear: link(ChemicalFluidSim.FRAG_CLEAR),
            advection: link(ChemicalFluidSim.FRAG_ADVECTION),
            splat: link(ChemicalFluidSim.FRAG_SPLAT),
            divergence: link(ChemicalFluidSim.FRAG_DIVERGENCE),
            curl: link(ChemicalFluidSim.FRAG_CURL),
            vorticity: link(ChemicalFluidSim.FRAG_VORTICITY),
            pressure: link(ChemicalFluidSim.FRAG_PRESSURE),
            gradientSubtract: link(ChemicalFluidSim.FRAG_GRADIENT_SUBTRACT),
            display: link(ChemicalFluidSim.FRAG_DISPLAY)
        };
    }

    _wrapProgram(program) {
        const gl = this.gl;
        const uniforms = {};
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
            const info = gl.getActiveUniform(program, i);
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }
        return { program, uniforms };
    }

    _useProgram(p) {
        this.gl.useProgram(p.program);
        return p;
    }

    _createFBO(w, h, internalFormat, format, type, filter) {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);

        return {
            texture, fbo, width: w, height: h,
            attach: (id) => { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; }
        };
    }

    _createDoubleFBO(w, h, internalFormat, format, type, filter) {
        let fbo1 = this._createFBO(w, h, internalFormat, format, type, filter);
        let fbo2 = this._createFBO(w, h, internalFormat, format, type, filter);
        return {
            width: w, height: h,
            get read() { return fbo1; },
            set read(v) { fbo1 = v; },
            get write() { return fbo2; },
            set write(v) { fbo2 = v; },
            swap() { const tmp = fbo1; fbo1 = fbo2; fbo2 = tmp; }
        };
    }

    _initFramebuffers() {
        const gl = this.gl;
        const type = this._texType.type;
        const filter = this._supportsLinear ? gl.LINEAR : gl.NEAREST;
        const rgba = gl.RGBA;

        const simSize = this._getResolution(this.config.SIM_RESOLUTION);
        const dyeSize = this._getResolution(this.config.DYE_RESOLUTION);
        this._simSize = simSize;
        this._dyeSize = dyeSize;

        this.velocity = this._createDoubleFBO(simSize.width, simSize.height, rgba, rgba, type, filter);
        this.wipe = this._createDoubleFBO(dyeSize.width, dyeSize.height, rgba, rgba, type, filter);
        this.divergence = this._createFBO(simSize.width, simSize.height, rgba, rgba, type, gl.NEAREST);
        this.curl = this._createFBO(simSize.width, simSize.height, rgba, rgba, type, gl.NEAREST);
        this.pressure = this._createDoubleFBO(simSize.width, simSize.height, rgba, rgba, type, gl.NEAREST);
    }

    _getResolution(resolution) {
        const { width, height } = this.getSize();
        const aspect = (width && height) ? width / height : 1;
        let min = resolution;
        let max = Math.round(resolution * Math.max(aspect, 1 / aspect));
        if (width > height) return { width: max, height: min };
        return { width: min, height: max };
    }

    _initBlit() {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        const elemBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        this._blitTo = (target) => {
            if (target == null) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
                gl.viewport(0, 0, target.width, target.height);
            }
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        };
    }

    _resizeCanvas() {
        const gl = this.gl;
        const { width, height } = this.getSize();
        if (!width || !height) return;
        const dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? 2 : 2.5);
        const w = Math.max(1, Math.round(width * dpr));
        const h = Math.max(1, Math.round(height * dpr));
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
        gl.viewport(0, 0, w, h);
        this._initFramebuffers();
    }

    registerPond(id, xPx, yPx, radiusPx) {
        const gridSize = this.config.POND_GRID_SIZE;
        const cells = new Float32Array(gridSize * gridSize);
        const activeMask = new Uint8Array(gridSize * gridSize);
        let activeCount = 0;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cx = (col + 0.5) / gridSize * 2 - 1;
                const cy = (row + 0.5) / gridSize * 2 - 1;
                const idx = row * gridSize + col;
                if (cx * cx + cy * cy <= 1.0) {
                    activeMask[idx] = 1;
                    activeCount++;
                }
            }
        }

        this.ponds.set(id, {
            id, xPx, yPx, radiusPx,
            gridSize, cells, activeMask, activeCount,
            clearedFraction: 0,
            revealed: false,
            currentRadius: radiusPx,
            targetRadius: radiusPx
        });
    }

    unregisterPond(id) { this.ponds.delete(id); }

    updatePondPosition(id, xPx, yPx, radiusPx) {
        const pond = this.ponds.get(id);
        if (!pond) return;
        pond.xPx = xPx; pond.yPx = yPx;
        if (radiusPx) { pond.radiusPx = radiusPx; if (!pond.revealed) pond.targetRadius = radiusPx; }
    }

    getPondClearance(id) {
        const pond = this.ponds.get(id);
        return pond ? pond.clearedFraction : 0;
    }

    isPondRevealed(id) {
        const pond = this.ponds.get(id);
        return pond ? pond.revealed : false;
    }

    _addSplatToPonds(xPx, yPx, intensity) {
        // Radio de interacción físico fino y preciso para que cueste revelar
        const brush = 18; 
        
        this.ponds.forEach((pond) => {
            if (pond.revealed) return;
            const dx = xPx - pond.xPx, dy = yPx - pond.yPx;
            const dist = Math.hypot(dx, dy);
            if (dist > pond.radiusPx + brush) return;

            const gridSize = pond.gridSize;
            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    const idx = row * gridSize + col;
                    if (!pond.activeMask[idx]) continue;
                    const cellX = pond.xPx + ((col + 0.5) / gridSize * 2 - 1) * pond.radiusPx;
                    const cellY = pond.yPx + ((row + 0.5) / gridSize * 2 - 1) * pond.radiusPx;
                    const cd = Math.hypot(xPx - cellX, yPx - cellY);
                    if (cd > brush) continue;
                    
                    const falloff = 1 - (cd / brush);
                    // Acumulación débil: requiere que frotes más sobre el mismo lugar
                    pond.cells[idx] = Math.min(1, pond.cells[idx] + intensity * falloff * 0.15);
                }
            }
        });
    }

    _updatePonds(dt) {
        const decayFactor = Math.exp(-this.config.POND_DECAY_PER_SEC * dt);
        const shrinkT = Math.min(1, dt / Math.max(0.05, this.config.REVEAL_SHRINK_SECONDS));

        this.ponds.forEach((pond) => {
            if (pond.revealed) {
                pond.currentRadius += (pond.targetRadius - pond.currentRadius) * shrinkT;
                return;
            }

            let clearedCells = 0;
            for (let i = 0; i < pond.cells.length; i++) {
                if (!pond.activeMask[i]) continue;
                pond.cells[i] *= decayFactor;
                if (pond.cells[i] >= this.config.CELL_CLEAR_THRESHOLD) clearedCells++;
            }
            pond.clearedFraction = pond.activeCount ? clearedCells / pond.activeCount : 0;
            this.onPondUpdate(pond.id, pond.clearedFraction);

            if (pond.clearedFraction >= this.config.REVEAL_FRACTION) {
                pond.revealed = true;
                pond.targetRadius = 0;
                this.onPondRevealed(pond.id);
            }
        });
    }

    agitateFluid(x, y, dx, dy, speed) {
        if (!this.gl) return;
        const { width, height } = this.getSize();
        if (!width || !height) return;

        const u = x / width;
        const v = 1.0 - (y / height);
        const forceScale = this.config.SPLAT_FORCE * 0.0011;
        const vx = dx * forceScale;
        const vy = -dy * forceScale;
        
        // Efecto visual de limpiar más contenido y menos exagerado
        const wipeAmount = Math.min(0.85, 0.2 + (speed || 4) * 0.02);

        this._pendingSplats.push({ u, v, vx, vy, wipeAmount });
        
        // Impacto lógico en la foto disminuido para forzar a "frotar"
        this._addSplatToPonds(x, y, Math.min(1, 0.15 + (speed || 4) * 0.015));
        this._ensureLoop();
    }

    _applySplat(s) {
        const gl = this.gl;
        const { width, height } = this._simSize;
        const aspect = width / height;
        const radiusUV = this.config.SPLAT_RADIUS_PX / this.getSize().width;
        const radiusParam = radiusUV * radiusUV * 4;

        let p = this._useProgram(this.programs.splat);
        gl.uniform1i(p.uniforms.uTarget, this.velocity.read.attach(0));
        gl.uniform1f(p.uniforms.aspectRatio, aspect);
        gl.uniform2f(p.uniforms.point, s.u, s.v);
        gl.uniform3f(p.uniforms.value, s.vx, s.vy, 0.0);
        gl.uniform1f(p.uniforms.radius, radiusParam);
        this._blitTo(this.velocity.write);
        this.velocity.swap();

        p = this._useProgram(this.programs.splat);
        gl.uniform1i(p.uniforms.uTarget, this.wipe.read.attach(0));
        gl.uniform2f(p.uniforms.point, s.u, s.v);
        gl.uniform3f(p.uniforms.value, s.wipeAmount, 0.0, 0.0);
        gl.uniform1f(p.uniforms.radius, radiusParam);
        this._blitTo(this.wipe.write);
        this.wipe.swap();
    }

    _step(dt) {
        const gl = this.gl;
        gl.disable(gl.BLEND);

        const simTexel = { x: 1 / this._simSize.width, y: 1 / this._simSize.height };

        while (this._pendingSplats.length) this._applySplat(this._pendingSplats.shift());
        this._updatePonds(dt);

        let p = this._useProgram(this.programs.curl);
        gl.uniform2f(p.uniforms.texelSize, simTexel.x, simTexel.y);
        gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0));
        this._blitTo(this.curl);

        p = this._useProgram(this.programs.vorticity);
        gl.uniform2f(p.uniforms.texelSize, simTexel.x, simTexel.y);
        gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0));
        gl.uniform1i(p.uniforms.uCurl, this.curl.attach(1));
        gl.uniform1f(p.uniforms.curlStrength, this.config.CURL);
        gl.uniform1f(p.uniforms.dt, dt);
        this._blitTo(this.velocity.write);
        this.velocity.swap();

        p = this._useProgram(this.programs.divergence);
        gl.uniform2f(p.uniforms.texelSize, simTexel.x, simTexel.y);
        gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0));
        this._blitTo(this.divergence);

        p = this._useProgram(this.programs.clear);
        gl.uniform1i(p.uniforms.uTexture, this.pressure.read.attach(0));
        gl.uniform1f(p.uniforms.value, this.config.PRESSURE_DISSIPATION);
        this._blitTo(this.pressure.write);
        this.pressure.swap();

        p = this._useProgram(this.programs.pressure);
        gl.uniform2f(p.uniforms.texelSize, simTexel.x, simTexel.y);
        gl.uniform1i(p.uniforms.uDivergence, this.divergence.attach(0));
        for (let i = 0; i < this.config.PRESSURE_ITERATIONS; i++) {
            gl.uniform1i(p.uniforms.uPressure, this.pressure.read.attach(1));
            this._blitTo(this.pressure.write);
            this.pressure.swap();
        }

        p = this._useProgram(this.programs.gradientSubtract);
        gl.uniform2f(p.uniforms.texelSize, simTexel.x, simTexel.y);
        gl.uniform1i(p.uniforms.uPressure, this.pressure.read.attach(0));
        gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(1));
        this._blitTo(this.velocity.write);
        this.velocity.swap();

        p = this._useProgram(this.programs.advection);
        gl.uniform2f(p.uniforms.texelSize, simTexel.x, simTexel.y);
        gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0));
        gl.uniform1i(p.uniforms.uSource, this.velocity.read.attach(0));
        gl.uniform1f(p.uniforms.dt, dt);
        gl.uniform1f(p.uniforms.dissipation, this.config.VELOCITY_DISSIPATION);
        this._blitTo(this.velocity.write);
        this.velocity.swap();

        p = this._useProgram(this.programs.advection);
        gl.uniform2f(p.uniforms.texelSize, simTexel.x, simTexel.y);
        gl.uniform1i(p.uniforms.uVelocity, this.velocity.read.attach(0));
        gl.uniform1i(p.uniforms.uSource, this.wipe.read.attach(1));
        gl.uniform1f(p.uniforms.dt, dt);
        gl.uniform1f(p.uniforms.dissipation, this.config.WIPE_DISSIPATION);
        this._blitTo(this.wipe.write);
        this.wipe.swap();
    }

    _renderToScreen() {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const { width, height } = this.getSize();
        const aspect = width && height ? width / height : 1;

        const p = this._useProgram(this.programs.display);
        gl.uniform1i(p.uniforms.uWipe, this.wipe.read.attach(0));
        gl.uniform1i(p.uniforms.uCurl, this.curl.attach(1));
        gl.uniform1f(p.uniforms.aspectRatio, aspect);
        gl.uniform1f(p.uniforms.baseOpacity, this.config.BASE_OPACITY);
        gl.uniform1f(p.uniforms.uWarmth, this.warmth);

        const ids = [...this.ponds.keys()].slice(0, this.config.MAX_PONDS);
        for (let i = 0; i < 4; i++) {
            const pond = ids[i] ? this.ponds.get(ids[i]) : null;
            const cUniform = p.uniforms[`pondCenter${i}`];
            const rUniform = p.uniforms[`pondRadius${i}`];
            if (pond && width && height) {
                const u = pond.xPx / width;
                const v = 1.0 - (pond.yPx / height);
                gl.uniform2f(cUniform, u, v);
                
                gl.uniform1f(rUniform, pond.currentRadius / height);
            } else {
                gl.uniform2f(cUniform, -10, -10);
                gl.uniform1f(rUniform, 0);
            }
        }

        this._blitTo(null);
    }

    _ensureLoop() {
        if (this._rafId == null && this.isActive()) this._loop();
    }

    _loop() {
        if (!this.isActive()) { this._rafId = null; return; }
        const now = performance.now();
        let dt = Math.min((now - this._lastTime) / 1000, 1 / 30);
        this._lastTime = now;

        this._step(dt || 1 / 60);
        this._renderToScreen();

        this._rafId = requestAnimationFrame(() => this._loop());
    }

    resetFluid() {
        if (!this.gl) return;
        const gl = this.gl;

        // FIX: Asegurar que el viewport esté apuntando correctamente a la textura para que el clear afecte toda el área
        gl.viewport(0, 0, this.wipe.read.width, this.wipe.read.height);

        // Limpiar textura de Wipe (El líquido opaco vuelve a llenar la pantalla)
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.wipe.read.fbo);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.wipe.write.fbo);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.viewport(0, 0, this.velocity.read.width, this.velocity.read.height);

        // Limpiar textura de Velocidad (Detiene cualquier inercia previa del fluido)
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.velocity.read.fbo);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.velocity.write.fbo);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Reiniciar las físicas y contadores de las polaroids hundidas
        this.ponds.forEach(pond => {
            pond.clearedFraction = 0;
            pond.revealed = false;
            pond.cells.fill(0);
            pond.currentRadius = pond.radiusPx;
            pond.targetRadius = pond.radiusPx;
        });
    }

    start() {
        if (!this.gl) return;
        this._lastTime = performance.now();
        if (this._rafId == null) this._loop();
    }

    stop() {
        if (this._rafId != null) cancelAnimationFrame(this._rafId);
        this._rafId = null;
    }
}

window.ChemicalFluidSim = ChemicalFluidSim;
