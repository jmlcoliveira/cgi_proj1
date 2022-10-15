precision mediump float;

uniform vec2 uScale;

// Vertex position in World Coordinates
attribute vec2 vPosition;

varying vec2 fPosition;
varying vec2 fScale;

void main() 
{
    fPosition = vPosition*uScale;
    fScale = uScale;
    gl_Position = vec4(vPosition, 0.0, 1.0);
}