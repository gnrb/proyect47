/* ==========================================================================
   GALAXY PHYSICS ENGINE (GPGPU) - Fase 2: Motor de Cómputo Completo
   ========================================================================== */
class GalaxyPhysicsSim {
    constructor(renderer, size = 256) {
        this.renderer = renderer;
        this.texSize = size; // 256x256 = 65,536 partículas
        this.particlesCount = this.texSize * this.texSize;
        
        // Detectar soporte
        const gl = this.renderer.getContext();
        this.dataType = gl.getExtension('OES_texture_float') ? THREE.FloatType : THREE.HalfFloatType;
        
        // Iniciar el Renderizador de Cómputo
        this.gpuCompute = new THREE.GPUComputationRenderer(this.texSize, this.texSize, this.renderer);
        if (this.dataType === THREE.HalfFloatType) {
            this.gpuCompute.setDataType(THREE.HalfFloatType);
        }

        this.initComputeRenderer();
        this.initRenderMaterial();
        console.log("🌌 Motor GPGPU Galáctico Activo. Partículas:", this.particlesCount);
    }

    initComputeRenderer() {
        // 1. Crear texturas en blanco
        const dtPosition = this.gpuCompute.createTexture();
        const dtVelocity = this.gpuCompute.createTexture();
        
        // 2. Llenar con datos iniciales (forma de galaxia)
        this.fillPositionTexture(dtPosition);
        this.fillVelocityTexture(dtVelocity);

        // 3. Shaders de Cómputo (La Física pura en la GPU)
        const computeVelocityShader = `
            uniform float uTime;
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 pos = texture2D(texturePosition, uv);
                vec4 vel = texture2D(textureVelocity, uv);

                vec3 dir = -pos.xyz;
                float dist = length(dir);

                // Gravedad simple hacia el centro (agujero negro)
                vec3 gravity = normalize(dir) * (1.8 / (dist * dist + 0.1));

                // Rotación espiral tangencial. OJO: antes esto era una magnitud
                // constante (2.2) sin importar la distancia, mientras que la
                // gravedad decae en 1/dist². Eso inyecta torque para siempre sin
                // nada que lo frene en los bordes, así que las partículas externas
                // se aceleran indefinidamente y la galaxia se "desarma" con el
                // tiempo. Ahora el tangencial también decae con la distancia
                // (perfil similar al de la gravedad), así ambos se balancean en
                // vez de que uno gane siempre a largo plazo.
                // Rotación espiral tangencial.
                // FIX DEFORMACIÓN CON EL TIEMPO ("problema del enrollamiento"):
                // La gravedad cae como 1/dist² pero esta rotación caía como
                // ~1/dist. Al no tener la misma "forma" de caída, la relación
                // entre ambas fuerzas cambiaba según la distancia: cerca del
                // centro iban balanceadas, pero en el borde la rotación
                // dominaba mucho más que la gravedad. Con el paso del tiempo
                // eso hace que las partículas externas ganen ángulo cada vez
                // más rápido que las internas — el disco se retuerce hasta
                // verse como una aspa afilada (justo la deformación que se ve
                // en las capturas). Ahora decae también como 1/dist², igual
                // que la gravedad, así la proporción entre ambas se mantiene
                // constante en todo el radio y con el tiempo, y el disco deja
                // de retorcerse progresivamente.
                vec3 tangential = cross(normalize(dir), vec3(0.0, 1.0, 0.0)) * (2.6 / (dist * dist + 0.6));

                // FIX núcleo: en dist=0 el tangencial y la gravedad son ambos
                // máximos en el mismo punto, lo que esparcía el núcleo en vez
                // de dejarlo compacto. Apagamos la rotación gradualmente cerca
                // del centro (ahora hasta radio ~1.0, un poco más ancho que
                // antes para que la transición núcleo→brazos sea más suave y
                // no se noten "muescas" donde empiezan los brazos) dejando que
                // ahí mande la gravedad y se forme un núcleo sólido.
                float coreTaper = smoothstep(0.0, 1.0, dist);
                tangential *= coreTaper;

                // Contención suave: más allá del radio 7, aparece una fuerza de
                // retorno hacia el centro que crece con cuánto se pasaron. Actúa
                // como una correa invisible: nadie escapa al infinito, y no hay
                // teletransporte ni "pop" visual, la desaceleración es gradual.
                float excess = max(dist - 7.0, 0.0);
                vec3 containment = normalize(dir) * excess * 1.5;
                
                // Un poco de caos / ruido basado en la posición original
                float noise = sin(pos.x * 10.0 + uTime) * cos(pos.z * 10.0 + uTime) * 0.05;

                // Aplicar fuerzas
                vel.xyz += (gravity + tangential + containment + vec3(0.0, noise, 0.0)) * 0.01;
                
                // Fricción del vacío para estabilidad. Un poco más fuerte que
                // el valor original (0.982) para que cualquier pequeño
                // desbalance residual se amortigüe con el tiempo en vez de
                // acumularse durante sesiones largas.
                vel.xyz *= 0.975;

                gl_FragColor = vec4(vel.xyz, 1.0);
            }
        `;

        const computePositionShader = `
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 pos = texture2D(texturePosition, uv);
                vec4 vel = texture2D(textureVelocity, uv);
                
                // Actualizar posición sumando la velocidad
                pos.xyz += vel.xyz * 0.016; // 0.016 es approx 1 frame a 60fps
                
                gl_FragColor = vec4(pos.xyz, 1.0);
            }
        `;

        // 4. Añadir variables al motor
        this.velocityVariable = this.gpuCompute.addVariable("textureVelocity", computeVelocityShader, dtVelocity);
        this.positionVariable = this.gpuCompute.addVariable("texturePosition", computePositionShader, dtPosition);

        // 5. Configurar dependencias (Posición necesita Velocidad, Velocidad necesita Posición)
        this.gpuCompute.setVariableDependencies(this.velocityVariable, [this.positionVariable, this.velocityVariable]);
        this.gpuCompute.setVariableDependencies(this.positionVariable, [this.positionVariable, this.velocityVariable]);

        // 6. Uniforms (Variables externas como el tiempo)
        this.velocityUniforms = this.velocityVariable.material.uniforms;
        this.velocityUniforms["uTime"] = { value: 0.0 };

        // 7. Inicializar
        const error = this.gpuCompute.init();
        if (error !== null) {
            console.error("GPGPU Error:", error);
        }
    }

    fillPositionTexture(texture) {
        const data = texture.image.data;
        const radius = 6.0;
        const branches = 5;
        const spin = 1.2;

        for (let i = 0; i < this.particlesCount; i++) {
            const i4 = i * 4;
            const r = Math.pow(Math.random(), 2.5) * radius;
            const branchAngle = ((i % branches) / branches) * Math.PI * 2;
            const spinAngle = r * spin;
            const angle = branchAngle + spinAngle;

            // FIX núcleo (parte 2 — generación de posiciones):
            // El ángulo de cada partícula depende SOLO de branchAngle (uno de
            // 5 valores fijos) + spinAngle (que crece con r). Lejos del centro
            // spinAngle varía bastante y dispersa bien las partículas, pero
            // cerca de r=0 spinAngle≈0 para todas, así que miles de partículas
            // quedan apiladas en exactamente los mismos 5 ángulos — eso es lo
            // que se ve como el "molinillo"/aspa de 5 puntas en el núcleo.
            // Agregamos dispersión angular aleatoria que es fuerte solo muy
            // cerca del centro (donde hacía falta) y se apaga rápido hacia
            // afuera, así los brazos espirales de más lejos no se tocan nada.
            const coreJitterFalloff = Math.exp(-r * 1.4);
            const angleJitter = (Math.random() - 0.5) * Math.PI * 2 * coreJitterFalloff;
            const finalAngle = angle + angleJitter;

            data[i4 + 0] = Math.cos(finalAngle) * r; 
            data[i4 + 1] = (Math.random() - 0.5) * (0.1 + r * 0.1); // Más grueso en los bordes
            data[i4 + 2] = Math.sin(finalAngle) * r;
            data[i4 + 3] = 1.0; 
        }
    }

    fillVelocityTexture(texture) {
        const data = texture.image.data;
        for (let i = 0; i < this.particlesCount; i++) {
            const i4 = i * 4;
            data[i4 + 0] = 0;
            data[i4 + 1] = 0;
            data[i4 + 2] = 0;
            data[i4 + 3] = 1;
        }
    }

    // ======================================================================
    // RENDERIZADO: faltaba esta mitad. El compute solo calcula texturas de
    // posición/velocidad en GPU; hace falta una malla de puntos cuyo vertex
    // shader lea "texturePosition" por partícula (vía un atributo de
    // referencia UV) para que algo aparezca en pantalla.
    // ======================================================================
    initRenderMaterial() {
        const geometry = new THREE.BufferGeometry();

        // 'position' es un atributo dummy: Three.js lo espera para geometría
        // de puntos, pero la posición REAL de cada partícula se lee de la
        // textura en el vertex shader, no de este atributo.
        const dummyPositions = new Float32Array(this.particlesCount * 3);

        // 'reference' mapea cada vértice a su texel (uv) dentro de la
        // textura de posición/velocidad — así cada punto sabe qué partícula
        // de la simulación le corresponde.
        const reference = new Float32Array(this.particlesCount * 2);

        for (let i = 0; i < this.particlesCount; i++) {
            const x = (i % this.texSize) / this.texSize;
            const y = Math.floor(i / this.texSize) / this.texSize;
            reference[i * 2 + 0] = x + 0.5 / this.texSize;
            reference[i * 2 + 1] = y + 0.5 / this.texSize;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(dummyPositions, 3));
        geometry.setAttribute('reference', new THREE.BufferAttribute(reference, 2));

        this.pointsMaterial = new THREE.ShaderMaterial({
            uniforms: {
                texturePosition: { value: null },
                uPointScale: { value: 1.0 }
            },
            vertexShader: `
                uniform sampler2D texturePosition;
                uniform float uPointScale;
                varying vec3 vColor;
                varying float vAlpha;
                attribute vec2 reference;

                void main() {
                    vec3 pos = texture2D(texturePosition, reference).xyz;

                    float dist = length(pos);
                    float t = clamp(dist / 7.0, 0.0, 1.0);

                    vec3 colorCore  = vec3(1.0, 1.0, 1.0);
                    vec3 colorInner = vec3(1.0, 0.33, 0.0);
                    vec3 colorOuter = vec3(0.10, 0.31, 1.0);

                    vColor = t < 0.5
                        ? mix(colorCore, colorInner, t * 2.0)
                        : mix(colorInner, colorOuter, (t - 0.5) * 2.0);

                    // Se desvanece suavemente cerca del borde de contención,
                    // en vez de cortar en seco.
                    vAlpha = 1.0 - smoothstep(0.85, 1.0, t);

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = uPointScale * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    vec2 uv = gl_PointCoord - 0.5;
                    float d = length(uv);
                    if (d > 0.5) discard;

                    float glow = smoothstep(0.5, 0.0, d);
                    gl_FragColor = vec4(vColor, glow * vAlpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.points = new THREE.Points(geometry, this.pointsMaterial);

        // Las posiciones reales viven en la textura, no en el atributo
        // 'position' (que es todo ceros), así que Three.js no puede calcular
        // un bounding sphere útil para el frustum culling automático.
        // Sin esto, el motor podría "recortar" toda la nube de partículas
        // por error.
        this.points.frustumCulled = false;
    }

    getPoints() {
        return this.points;
    }

    // Esta función actualiza la física, debe llamarse en tu requestAnimationFrame (tick)
    update(time) {
        this.velocityUniforms["uTime"].value = time;
        this.gpuCompute.compute();

        // Mantenemos el material de render apuntando siempre a la textura
        // de posición más reciente (el ping-pong interno del compute
        // renderer alterna qué render target es "actual" cada frame).
        this.pointsMaterial.uniforms.texturePosition.value = this.getCurrentPositionTexture();
    }

    // Obtener la textura con las posiciones actuales para dársela al material de Three.js
    getCurrentPositionTexture() {
        return this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
    }

    dispose() {
        if (this.points) {
            this.points.geometry.dispose();
            this.pointsMaterial.dispose();
        }
    }
}

window.GalaxyPhysicsSim = GalaxyPhysicsSim;
