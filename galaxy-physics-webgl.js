/* ==========================================================================
   GALAXY PHYSICS ENGINE (GPGPU) - Fase 1: Arquitectura Base
   ========================================================================== */
class GalaxyPhysicsSim {
    constructor(renderer) {
        this.renderer = renderer;
        
        // Textura cuadrada de 256x256 píxeles = 65,536 partículas
        this.texSize = 256; 
        this.particlesCount = this.texSize * this.texSize;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        // Detectar soporte para texturas de alta precisión (Vital para móviles)
        const gl = this.renderer.getContext();
        if (!gl.getExtension('OES_texture_float')) {
            console.warn("OES_texture_float no soportado. Usando modo de compatibilidad.");
            this.dataType = THREE.HalfFloatType;
        } else {
            this.dataType = THREE.FloatType;
        }
        
        this.initTextures();
        console.log("🌌 Motor GPGPU Galáctico Inicializado. Partículas:", this.particlesCount);
    }

    initTextures() {
        // En vez de Arrays de posiciones en CPU, creamos "Texturas de Datos" para la GPU
        // Cada píxel guarda (X, Y, Z, Masa) en vez de (R, G, B, Alpha)
        const posData = new Float32Array(this.particlesCount * 4);
        const velData = new Float32Array(this.particlesCount * 4);

        const radius = 6.0;
        const branches = 4;
        const spin = 1.5;

        for (let i = 0; i < this.particlesCount; i++) {
            const i4 = i * 4;
            
            // Distribuimos las estrellas en espiral (Herencia de tu código original)
            const r = Math.pow(Math.random(), 3) * radius;
            const branchAngle = ((i % branches) / branches) * Math.PI * 2;
            const spinAngle = r * spin;
            
            const angle = branchAngle + spinAngle;
            
            // Posición Inicial
            posData[i4 + 0] = Math.cos(angle) * r; 
            posData[i4 + 1] = (Math.random() - 0.5) * 0.4; 
            posData[i4 + 2] = Math.sin(angle) * r;
            posData[i4 + 3] = 1.0; 
            
            // Velocidad Inicial (empuje tangencial para órbitas perfectas)
            velData[i4 + 0] = -Math.sin(angle) * 0.05;
            velData[i4 + 1] = 0.0;
            velData[i4 + 2] = Math.cos(angle) * 0.05;
            velData[i4 + 3] = 1.0;
        }

        this.posTexture = new THREE.DataTexture(posData, this.texSize, this.texSize, THREE.RGBAFormat, this.dataType);
        this.posTexture.needsUpdate = true;

        this.velTexture = new THREE.DataTexture(velData, this.texSize, this.texSize, THREE.RGBAFormat, this.dataType);
        this.velTexture.needsUpdate = true;
    }
}

window.GalaxyPhysicsSim = GalaxyPhysicsSim;