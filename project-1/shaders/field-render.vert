precision mediump float;

const int MAX_PLANETS = 10;

uniform vec2 uScale;
uniform vec2 uPlanetsPos[MAX_PLANETS];
uniform float uPlanetsR[MAX_PLANETS];

// Vertex position in World Coordinates
attribute vec2 vPosition;

varying vec2 fPosition;
varying vec2 fPlanetsPos[MAX_PLANETS];
varying float fPlanetsR[MAX_PLANETS];

void main() 
{
    fPosition = vPosition*uScale;
    for(int i=0; i<MAX_PLANETS; i++) {
        fPlanetsPos[i] = uPlanetsPos[i];
        fPlanetsR[i] = uPlanetsR[i];
    }

    gl_Position = vec4(vPosition, 0.0, 1.0);
}