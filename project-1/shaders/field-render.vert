precision mediump float;


uniform float uXScale;
uniform float uYScale;

// Vertex position in World Coordinates
attribute vec2 vPosition;

void main() 
{
    gl_Position = vec4(vPosition, 0.0, 1.0);
}