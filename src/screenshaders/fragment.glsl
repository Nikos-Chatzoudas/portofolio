    #define PI 3.1415926538

    uniform sampler2D uDiffuse;
    uniform float uTime;
    uniform float LINE_SIZE;
    uniform float LINE_STRENGTH;
    uniform float NOISE_STRENGTH;
    uniform float BRIGHTNESS;
    uniform float CONTRAST;
    varying vec2 vUv;

    float rand(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float squareWave(float x){
        return (
            (4.0/PI * sin(PI*LINE_SIZE*x))
            +(4.0/PI * 1.0/3.0 * sin(3.0*PI*LINE_SIZE*x))
            +(4.0/PI * 1.0/5.0 * sin(5.0*PI*LINE_SIZE*x))
        )*LINE_STRENGTH;
    }

    void main() {
        vec4 color = texture2D(uDiffuse, vUv);
        float r = rand(vUv*uTime);
        float scanline = squareWave(vUv.y);
        
        // Apply noise and scanline effects uniformly
        vec3 finalColor = color.rgb + (vec3(r) * NOISE_STRENGTH) + vec3(scanline);
        
        // Apply brightness and contrast adjustments
        finalColor = (finalColor - 0.5) * CONTRAST + 0.5;
        finalColor *= BRIGHTNESS;
        
        // Selectively brighten the text
        float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
        float textThreshold = 0.5; // Adjust this value to fine-tune text detection
        float textBrightness = 1.5; // Adjust this value to control text brightness
        
        if (luminance > textThreshold) {
            finalColor *= textBrightness;
        }
        
        // Apply color boost
        finalColor = pow(finalColor, vec3(0.8)); // Increase color intensity
        
        gl_FragColor = vec4(finalColor, color.a);
    }