precision mediump float;

varying float fLeft;

void main() {
  gl_FragColor = vec4(1.0, 1.0, 0.9, mix(0.0, 1.0, fLeft));
}