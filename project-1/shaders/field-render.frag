precision highp float;

const int MAX_PLANETS = 10;
const float pi = 3.14159265359;
const float g = 00000000000.667;
const float p = 5510.0;
const float Rc = 6371000.0;
const float m1 = 1.0;

varying vec2 fPosition;
varying vec2 fPlanetsPos[MAX_PLANETS];
varying float fPlanetsR[MAX_PLANETS];

void main() {
    //gl_FragColor = vec4(mix(0.0, 1.0, mod(fPosition.x, 1.0)), mix(0.0, 1.0, mod(fPosition.y, 1.0)), 0.0, 1.0);
    float finalForce = 0.0;
    for(int i=0; i<MAX_PLANETS; i++) {
        float m2 = (4.0 * pi * pow(fPlanetsR[i], 3.0) * p) / 3.0;
        float dist = sqrt(pow(fPlanetsPos[i].x - fPosition.x, 2.0) + pow(fPlanetsPos[i].y - fPosition.y, 2.0));
        float force = (g * m1 * m2) / pow(dist, 2.0);
        finalForce += force;
    }

    gl_FragColor = vec4(1.0, 0.0, 0.0, mix(1.0, 0.0, finalForce*0.0000001));
    
}