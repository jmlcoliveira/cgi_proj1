precision mediump float;

varying float fLeft;

void main() {
  gl_FragColor = vec4(0.91, 0.77, 0.23, mix(1.0, 0.0, fLeft));
}