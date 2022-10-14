precision mediump float;

const int MAX_PLANETS = 10;

uniform vec2 uScale;
uniform vec2 uPlanetsPos[MAX_PLANETS];
uniform float uPlanetsR[MAX_PLANETS];
uniform float uCurrentPlanets;

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