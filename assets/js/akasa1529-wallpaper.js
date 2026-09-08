(() => {
    'use strict';

    const VERTEX = `#version 300 es
    precision highp float;
    out vec2 v_uv;
    void main() {
        vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
        v_uv = p;
        gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
    }`;
    const COMMON = `
    precision highp float;
    in vec2 v_uv;
    out vec4 color;
    uniform float u_time;
    const float ASPECT = 1920.0 / 1080.0;
    // Approximation for Wallpaper Engine util/noise.
    // Replace here if the original implementation becomes available.
    vec3 noiseHash(vec2 p) {
        vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
        q += dot(q, q.yxz + 33.33);
        return fract((q.xxy + q.yzz) * q.zyx);
    }
    vec3 engineNoise(vec2 uv) {
        vec2 p = fract(uv) * 256.0;
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(noiseHash(mod(i, 256.0)), noiseHash(mod(i + vec2(1,0), 256.0)), f.x),
                   mix(noiseHash(mod(i + vec2(0,1), 256.0)), noiseHash(mod(i + 1.0, 256.0)), f.x), f.y);
    }`;
    const MOTION = `#version 300 es
    ${COMMON}
    uniform sampler2D u_base, u_foliage, u_water, u_ripple, u_normal;
    uniform bvec3 u_motion;
    vec2 foliage(vec2 uv) {
        // scene.json: strength=.4, ratio=.3, phase=.5, power=1, scale=.05, speeduv=3.
        float amp = .4 * .4 * .005 * texture(u_foliage, uv).r;
        float phase = (engineNoise(uv * .05).g * 6.28318530718 + uv.x * 10.0 + uv.y * 5.0) * .5;
        vec4 a = sin(phase + 3.0 * u_time * vec4(1, -.16161616, .0083333, -.00019841));
        vec4 b = sin(.4 + phase + 3.0 * u_time * vec4(-.5, .041666666, -.0013888889, .000024801587));
        float aspect = ASPECT * .3;
        return uv + vec2(dot(a, vec4(amp)) / aspect, dot(b, vec4(amp)) * aspect);
    }
    vec2 waves(vec2 uv) {
        // direction=0, perspective=0, scale=200, speed=2.5, strength=.03.
        return uv + vec2(sin(u_time * 2.5 + uv.y * 200.0) * .03 * .03 * texture(u_water, uv).r, 0);
    }
    vec2 ripple(vec2 uv) {
        // scrollspeed=0 makes scrolldirection irrelevant; perspective/specular are disabled.
        vec2 scale = vec2(ASPECT, 1) * .8;
        vec3 n1 = texture(u_normal, (uv + u_time * .1 * .1) * scale).xyz * 2.0 - 1.0;
        vec3 n2 = texture(u_normal, (uv * 1.333 - u_time * .1 * .1) * scale).xyz * 2.0 - 1.0;
        vec3 n = vec3(n1.xy + n2.xy, n1.z);
        n /= max(length(n), .00001);
        return uv + n.xy * .06 * .06 * texture(u_ripple, uv).r;
    }
    void main() {
        // Images and original effect coordinates are top-left oriented. FBOs are bottom-left.
        vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
        // Reverse sampling composition preserves foliage -> waves -> ripple application order.
        if (u_motion.z) uv = ripple(uv);
        if (u_motion.y) uv = waves(uv);
        if (u_motion.x) uv = foliage(uv);
        color = vec4(texture(u_base, uv).rgb, 1);
    }`;
    const FINISH = `#version 300 es
    ${COMMON}
    uniform sampler2D u_scene;
    uniform vec2 u_crop, u_offset;
    uniform bvec2 u_finish;
    vec3 scene(vec2 uv) { return texture(u_scene, vec2(uv.x, 1.0 - uv.y)).rgb; }
    vec3 chromatic(vec2 uv) {
        // MODE=0, VARIATION=0, strength=.8, center=.5, falloff=1.
        vec2 delta = u_finish.x ? (uv - .5) * .8 * .01 : vec2(0);
        // Web background safety cap: retain the source strength/falloff but avoid persistent RGB splitting.
        vec2 pixels = delta * vec2(1920,1080);
        delta *= min(1.0, 2.0 / max(length(pixels), .0001));
        return vec3(scene(uv + delta).r, scene(uv).g, scene(uv - delta).b);
    }
    vec3 vhs(vec2 uv) {
        vec3 offset = .1 * smoothstep(vec3(0), vec3(2), 1.0 + .5 * sin(u_time * vec3(11,7,13) * 2.0)) * vec3(.0019,.0021,.0017);
        vec2 red = uv + vec2(offset.x + .005 * .1, .004 * .1 + offset.x);
        vec2 blue = uv + vec2(offset.y - offset.z - .0065 * .1, -.0045 * .1);
        vec3 result = vec3(chromatic(red).r, chromatic(uv).g, chromatic(blue).b);
        // frac(time) is part of the original VHS noise, not a reset of the animation clock.
        float t = fract(u_time);
        vec2 a = (uv + t) * .3 * vec2(ASPECT,1);
        vec2 b = (uv - t * 2.5) * .3 * .52 * vec2(ASPECT,1);
        vec3 noise = engineNoise(a) * engineNoise(b).gbr;
        // common_blending.h is not bundled: approximate its noise blend with soft light.
        vec3 soft = mix(result - (1.0 - 2.0 * noise) * result * (1.0 - result),
                        result + (2.0 * noise - 1.0) * (sqrt(result) - result), step(.5, noise));
        result = mix(result, soft, .1);
        result = mix(result, min(result + smoothstep(.7, 1.0, noise), 1.0), .1);
        vec2 n1 = engineNoise(a * vec2(.1,10) * .88).rg;
        vec2 n2 = engineNoise(b * vec2(.01,2) * .88).rg;
        float limiter = pow(.88, .2);
        float artifact = step(.9, n1.x * limiter) * step(.9, n2.x * limiter) * n1.y * n2.y;
        // distortionstrength=0, distortionspeed=0: no scanline displacement.
        return mix(result, 1.0 - result, artifact);
    }
    void main() {
        vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y) * u_crop + u_offset;
        color = vec4(u_finish.y ? vhs(uv) : chromatic(uv), 1);
    }`;

    function position(value) {
        let parts = (value || 'center center').trim().toLowerCase().split(/\s+/);
        if (parts.length === 1) parts = ['top', 'bottom'].includes(parts[0]) ? ['center', parts[0]] : [parts[0], 'center'];
        if (['top', 'bottom'].includes(parts[0])) parts.reverse();
        const words = { left: 0, top: 0, center: .5, right: 1, bottom: 1 };
        return parts.slice(0, 2).map(p => words[p] ?? (p.endsWith('%') && Number.isFinite(parseFloat(p)) ? parseFloat(p) / 100 : .5));
    }

    class AkasaWallpaper {
        constructor(canvas, config) {
            this.canvas = canvas;
            this.config = config;
            this.resources = [];
            this.started = performance.now();
            this.frame = 0;
            this.last = -Infinity;
            this.active = false;
            this.effects = { foliageSway: true, waterWaves: true, waterRipple: true, chromaticAberration: true, vhs: true, ...config.webgl.effects };
            this.resize = this.resize.bind(this);
            this.tick = this.tick.bind(this);
            this.visibility = () => {
                cancelAnimationFrame(this.frame);
                if (this.active && !document.hidden) this.frame = requestAnimationFrame(this.tick);
            };
            this.lost = event => { event.preventDefault(); this.fail(new Error('WebGL context lost; using image fallback.')); };
        }
        track(kind, object) {
            if (!object) throw new Error(`Could not allocate ${kind}`);
            this.resources.push([kind, object]);
            return object;
        }
        program(source) {
            const gl = this.gl;
            const shaders = [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, source]].map(([type, text]) => {
                const shader = this.track('Shader', gl.createShader(type));
                gl.shaderSource(shader, text); gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
                return shader;
            });
            const program = this.track('Program', gl.createProgram());
            shaders.forEach(shader => gl.attachShader(program, shader)); gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
            return program;
        }
        texture(image, repeat = false) {
            const gl = this.gl;
            const texture = this.track('Texture', gl.createTexture());
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
            if (image) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            return texture;
        }
        async start() {
            try {
                const gl = this.canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
                if (!gl) throw new Error('WebGL2 unavailable; using image fallback.');
                this.gl = gl;
                this.canvas.addEventListener('webglcontextlost', this.lost);
                const names = ['base', 'foliageMask', 'waterMask', 'rippleMask', 'rippleNormal'];
                const images = await Promise.all(names.map(name => new Promise((resolve, reject) => {
                    const img = new Image();
                    const timer = setTimeout(() => { img.src = ''; reject(new Error(`Texture timed out: ${name}`)); }, 15000);
                    img.onload = () => { clearTimeout(timer); resolve(img); };
                    img.onerror = () => { clearTimeout(timer); reject(new Error(`Texture unavailable: ${name}`)); };
                    img.src = this.config.webgl[name];
                })));
                if (this.failed) return;
                this.motion = this.program(MOTION); this.finish = this.program(FINISH);
                this.textures = images.map((img, i) => this.texture(img, i === 4));
                this.target = this.texture();
                this.fbo = this.track('Framebuffer', gl.createFramebuffer());
                this.vao = this.track('VertexArray', gl.createVertexArray());
                this.uniforms = new Map();
                for (const program of [this.motion, this.finish]) {
                    const locations = {};
                    for (const name of ['u_time', 'u_base', 'u_foliage', 'u_water', 'u_ripple', 'u_normal', 'u_motion', 'u_scene', 'u_crop', 'u_offset', 'u_finish']) locations[name] = gl.getUniformLocation(program, name);
                    this.uniforms.set(program, locations);
                }
                this.resize();
                if (this.failed) return;
                if (gl.getError() !== gl.NO_ERROR) throw new Error('WebGL initialization error');
                this.active = true;
                window.addEventListener('resize', this.resize);
                document.addEventListener('visibilitychange', this.visibility);
                this.visibility();
            } catch (error) { this.fail(error); }
        }
        resize() {
            if (this.failed) return;
            const gl = this.gl, canvas = this.canvas;
            this.mobile = matchMedia('(max-width: 767px)').matches;
            const width = window.innerWidth, height = window.innerHeight;
            const maxWidth = this.mobile ? 540 : 1920, maxHeight = this.mobile ? 960 : 1080;
            const scale = Math.min(devicePixelRatio || 1, this.mobile ? 1 : 1.5, maxWidth / width, maxHeight / height);
            canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale));
            this.targetWidth = this.mobile ? 960 : Math.min(1920, Math.max(canvas.width, Math.ceil(canvas.height * 16 / 9)));
            this.targetHeight = Math.round(this.targetWidth * 9 / 16);
            gl.bindTexture(gl.TEXTURE_2D, this.target);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.targetWidth, this.targetHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.target, 0);
            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) { this.fail(new Error('Incomplete framebuffer')); return; }
            const aspect = width / height / (16 / 9);
            this.crop = aspect < 1 ? [aspect, 1] : [1, 1 / aspect];
            this.offset = position(this.config.position).map((p, i) => (1 - this.crop[i]) * p);
            const fps = Number(this.config.performance?.[this.mobile ? 'mobileFPS' : 'desktopFPS']) || (this.mobile ? 30 : 60);
            this.interval = 1000 / Math.max(1, Math.min(60, fps));
        }
        draw(seconds) {
            const gl = this.gl;
            gl.bindVertexArray(this.vao);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
            gl.viewport(0, 0, this.targetWidth, this.targetHeight);
            gl.useProgram(this.motion);
            let u = this.uniforms.get(this.motion);
            gl.uniform1f(u.u_time, seconds);
            gl.uniform3i(u.u_motion, +this.effects.foliageSway, +this.effects.waterWaves, +this.effects.waterRipple);
            ['u_base', 'u_foliage', 'u_water', 'u_ripple', 'u_normal'].forEach((name, i) => {
                gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this.textures[i]); gl.uniform1i(u[name], i);
            });
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            // Future local-contrast passes belong here, between motion and color. Not implemented/enabled in this two-pass version.
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.useProgram(this.finish); u = this.uniforms.get(this.finish);
            gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.target); gl.uniform1i(u.u_scene, 0);
            gl.uniform1f(u.u_time, seconds); gl.uniform2fv(u.u_crop, this.crop); gl.uniform2fv(u.u_offset, this.offset);
            gl.uniform2i(u.u_finish, +this.effects.chromaticAberration, +this.effects.vhs);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        tick(now) {
            if (!this.active || document.hidden) return;
            if (now - this.last >= this.interval - .5) {
                try {
                    this.draw((now - this.started) / 1000);
                    if (!this.ready) {
                        if (this.gl.getError() !== this.gl.NO_ERROR) throw new Error('WebGL drawing error');
                        this.canvas.classList.add('is-ready'); this.ready = true;
                    }
                    const elapsed = now - this.last;
                    this.last = Number.isFinite(elapsed) && elapsed >= this.interval ? now - elapsed % this.interval : now;
                } catch (error) { this.fail(error); return; }
            }
            this.frame = requestAnimationFrame(this.tick);
        }
        fail(error) {
            this.failed = true;
            this.destroy();
            console.warn('[Wallpaper]', error.message);
        }
        destroy() {
            this.active = false;
            cancelAnimationFrame(this.frame);
            window.removeEventListener('resize', this.resize);
            document.removeEventListener('visibilitychange', this.visibility);
            this.canvas.removeEventListener('webglcontextlost', this.lost);
            this.canvas.classList.remove('is-ready');
            if (this.gl) this.resources.splice(0).reverse().forEach(([kind, resource]) => this.gl[`delete${kind}`](resource));
        }
    }
    window.AkasaWallpaper = AkasaWallpaper;
})();
