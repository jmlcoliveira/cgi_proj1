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
varying float fCurrentPlanets;


vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 finalForce = vec2(0.0, 0.0);
    highp int index = int(fCurrentPlanets);
    bool temp = false;

    for(int i=0; i<MAX_PLANETS; i++) {
        if(i >= index) break;
        float m2 = (4.0 * pi * pow(fPlanetsR[i]*Rc, 3.0) * p) / 3.0;
        float dist = sqrt(pow(fPlanetsPos[i].x - fPosition.x, 2.0) + pow(fPlanetsPos[i].y - fPosition.y, 2.0)) * Rc;
        float force = (g * m1 * m2) / pow(dist, 2.0);
        float angle = atan(fPlanetsPos[i].y - fPosition.y, fPlanetsPos[i].x - fPosition.x);
        vec2 currentForce = vec2(force*cos(angle), force*sin(angle));
        finalForce += currentForce;

        if(mod(fPlanetsR[i], 5.0) == 0.0)
            temp = true;
    }
    float finalAngle = atan(finalForce.y, finalForce.x);
    float finalForceIntensity = finalForce.x*cos(finalAngle) + finalForce.y*sin(finalAngle);
    if(mod(log(finalForceIntensity), 1.1) >= 0.0 && mod(log(finalForceIntensity), 1.1) <= 0.15) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else
    gl_FragColor = vec4(hsv2rgb(vec3(finalAngle/(2.0*pi), 1.0, 1.0)), mix(0.0, 1.0, abs(finalForceIntensity)/10000000000000.0));
}
