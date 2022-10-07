precision mediump float;

attribute vec2 vPosition;
attribute float vAge;
attribute float vLife;
attribute vec2 vVelocity;

varying float fLeft;

void main() {
  gl_PointSize = 2.0;
  gl_Position = vec4(vPosition, 0.0, 1.0);
  
  fLeft = vAge/vLife;
}