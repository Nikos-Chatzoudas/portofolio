varying vec2 vUv;

uniform float uTime;

void main() {
    float starDensity = 0.05; // Adjust star density
    vec3 color = vec3(0.0);

    float distance = length(vUv - 0.5);
    float star = smoothstep(0.5, 0.49, sin(distance * 20.0 + uTime) * 0.5 + 0.5);

    color = vec3(star);

    gl_FragColor = vec4(color, 1.0);
}
