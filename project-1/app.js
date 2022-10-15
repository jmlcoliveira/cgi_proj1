import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from '../../libs/utils.js';
import { vec2, flatten } from '../../libs/MV.js';

// Buffers: particles before update, particles after update, quad vertices
let inParticlesBuffer, outParticlesBuffer, quadBuffer;

// Particle system constants

// Total number of particles
const N_PARTICLES = 1000000;
const MIN_MAXLIFE = 2;
const MAX_MAXLIFE = 20;
const MIN_MINLIFE = 1;
const MAX_MINLIFE = 19;
const VELOCITY_INCREMENT = 0.01;
const FLUX_INCREMENT = 0.02;
const ANGLE_INCREMENT = 0.05;
const X_SCALE = 1.5;
let yScale = 0.0;

let drawPoints = true;
let drawField = true;

let time = undefined;

let minLife = 2;
let maxLife = 10;

let minVelocity = 0.1;
let maxVelocity = 0.2;

let velocityAngle = 0.0;
let fluxAngle = Math.PI;

const MAX_PLANETS = 10;
let currentPlanets = 0;
let mouseDown = false;
let planetsPos = [];
let planetsR = [];
let planetsType = [];


function main(shaders)
{
    // Generate the canvas element to fill the entire page
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    updateLabels();

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    yScale = X_SCALE * canvas.height/canvas.width;

    /** type {WebGL2RenderingContext} */
    const gl = setupWebGL(canvas, {alpha: true});

    // Initialize GLSL programs    
    const fieldProgram = buildProgramFromSources(gl, shaders["field-render.vert"], shaders["field-render.frag"]);
    const renderProgram = buildProgramFromSources(gl, shaders["particle-render.vert"], shaders["particle-render.frag"]);
    const updateProgram = buildProgramFromSources(gl, shaders["particle-update.vert"], shaders["particle-update.frag"], ["vPositionOut", "vAgeOut", "vLifeOut", "vVelocityOut"]);

    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Enable Alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 

    buildQuad();
    buildParticleSystem(N_PARTICLES);

    window.addEventListener("resize", function(event) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        yScale = X_SCALE * canvas.height/canvas.width;
        gl.viewport(0,0,canvas.width, canvas.height);
    });

    window.addEventListener("keydown", function(event) {
        console.log(event.key);
        switch(event.key) {
            case "PageUp":
                if(event.shiftKey && minVelocity+VELOCITY_INCREMENT<maxVelocity) 
                    minVelocity +=  VELOCITY_INCREMENT;
                 else if(!event.shiftKey) 
                    maxVelocity += VELOCITY_INCREMENT;
                break;
            case "PageDown":
                if(event.shiftKey && minVelocity>=VELOCITY_INCREMENT)
                    minVelocity -= VELOCITY_INCREMENT;
                else if(!event.shiftKey && minVelocity<maxVelocity-VELOCITY_INCREMENT)
                    maxVelocity -= VELOCITY_INCREMENT;
                break;
            case "ArrowUp":
                if(fluxAngle < Math.PI)
                    fluxAngle += FLUX_INCREMENT;
                else
                    fluxAngle = Math.PI;
                break;
            case "ArrowDown":
                if(fluxAngle > -Math.PI)
                    fluxAngle -= FLUX_INCREMENT;
                else
                    fluxAngle = -Math.PI;
                break;
            case "ArrowLeft":
                velocityAngle += ANGLE_INCREMENT;
                break;
            case "ArrowRight":
                velocityAngle -= ANGLE_INCREMENT;
                break;
            case 'q':
                if(minLife<MAX_MINLIFE && minLife<maxLife)
                    minLife++;
                break;
            case 'a':
                if(minLife>MIN_MINLIFE && minLife<=maxLife)
                    minLife--;
                break;
            case 'w':
                if(maxLife<MAX_MAXLIFE && minLife<=maxLife)
                    maxLife++;
                break;
            case 's':
                if(maxLife>MIN_MAXLIFE && minLife<maxLife)
                     maxLife--;
                break;
            case '0':
                drawField = !drawField;
                break;
            case '9':
                drawPoints  = !drawPoints;
                break; 
            case 'Shift':
                break;
            case 'Backspace':
                if(!mouseDown)
                    deleteMostRecentPlanet();
                break;
        }
        updateLabels();
    })
    
    canvas.addEventListener("mousedown", function(event) {
        if(!event.shiftKey)
            initializePlanet(event);
        updateLabels();
    });

    canvas.addEventListener("mousemove", function(event) {
        let p = getCursorPosition(canvas, event);
        const uSpawnPosition = gl.getUniformLocation(updateProgram, "uSpawnPosition");
        if(event.shiftKey) {
            gl.useProgram(updateProgram);
            gl.uniform2fv(uSpawnPosition, p);
        }
        else if(mouseDown && currentPlanets-1 < MAX_PLANETS){
            planetsR[currentPlanets-1] = Math.hypot(planetsPos[currentPlanets-1][1] - p[1], planetsPos[currentPlanets-1][0] - p[0]);
        }
    });

    canvas.addEventListener("mouseup", function(event) {
        mouseDown = false;
        }
    )

    function initializePlanet(event){
        if(currentPlanets < MAX_PLANETS){
            let p = getCursorPosition(canvas, event);
            planetsPos.push(p);
            mouseDown = true;
            planetsR[currentPlanets] = Math.hypot(planetsPos[currentPlanets][1] - p[1], planetsPos[currentPlanets][0] - p[0]);
            event.ctrlKey ? planetsType.push(-1.0) : planetsType.push(1.0);
            currentPlanets++;
        }
        else
            alert("Maximum number of planets added!");
    }

    function deleteMostRecentPlanet(){
        if(currentPlanets == 0)
        {
            alert("No more planets to delete!");
        }
        else{
            currentPlanets--;
            planetsPos.pop();
            planetsR.pop();
            planetsType.pop();
        }
    }
    
    function getCursorPosition(canvas, event) {
        const mx = event.offsetX;
        const my = event.offsetY;

        const x = ((mx / canvas.width * 2) - 1);
        const y = (((canvas.height - my)/canvas.height * 2) -1);
        return vec2(x,y);
    }

    window.requestAnimationFrame(animate);

    function buildQuad() {
        const vertices = [-1.0, 1.0, -1.0, -1.0, 1.0, -1.0,
                          -1.0, 1.0,  1.0, -1.0, 1.0,  1.0];
        
        quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    }

    function buildParticleSystem(nParticles) {
        const data = [];

        for(let i=0; i<nParticles; ++i) {
            // position
            let x = (2.0*Math.random()-1)*X_SCALE;
            let y = (2.0*Math.random()-1)*yScale;

            data.push(x); data.push(y);
            
            // age
            data.push(0.0);

            // life
            const life = randomNumBetween(minLife, maxLife);

            data.push(life);

            // velocity
            let angle = Math.random()*Math.PI*2;
            let v = randomNumBetween(minVelocity,maxVelocity);
            data.push(v*Math.cos(angle));
            data.push(v*Math.sin(angle));

        }

        inParticlesBuffer = gl.createBuffer();
        outParticlesBuffer = gl.createBuffer();

        // Input buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, inParticlesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STREAM_DRAW);

        // Output buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, outParticlesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STREAM_DRAW);
    }


    function animate(timestamp)
    {
        let deltaTime = 0;

        if(time === undefined) {        // First time
            time = timestamp/1000;
            deltaTime = 0;
        } 
        else {                          // All other times
            deltaTime = timestamp/1000 - time;
            time = timestamp/1000;
        }

        window.requestAnimationFrame(animate);

        // Clear framebuffer
        gl.clear(gl.COLOR_BUFFER_BIT);

        if(drawField) drawQuad();
        updateParticles(deltaTime);
        if(drawPoints) drawParticles(outParticlesBuffer, N_PARTICLES);

        swapParticlesBuffers();
    }

    function updateParticles(deltaTime)
    {
        // Setup uniforms
        const uDeltaTime = gl.getUniformLocation(updateProgram, "uDeltaTime");
        const uMaxLife = gl.getUniformLocation(updateProgram, "uMaxLife");
        const uMinLife = gl.getUniformLocation(updateProgram, "uMinLife");
        const uMaxVelocity = gl.getUniformLocation(updateProgram, "uMaxVelocity");
        const uMinVelocity = gl.getUniformLocation(updateProgram, "uMinVelocity");
        const uVelocityAngle = gl.getUniformLocation(updateProgram, "uVelocityAngle");
        const uFluxAngle = gl.getUniformLocation(updateProgram, "uFluxAngle");
        const uCurrentPlanets = gl.getUniformLocation(updateProgram, "uCurrentPlanets");
        const uScale = gl.getUniformLocation(updateProgram, "uScale");

        gl.useProgram(updateProgram);

        gl.uniform1f(uDeltaTime, deltaTime);
        gl.uniform1f(uMaxLife, maxLife);
        gl.uniform1f(uMinLife, minLife);
        gl.uniform1f(uMaxVelocity, maxVelocity);
        gl.uniform1f(uMinVelocity, minVelocity);
        gl.uniform1f(uVelocityAngle, velocityAngle);
        gl.uniform1f(uFluxAngle, fluxAngle);
        gl.uniform1f(uCurrentPlanets, currentPlanets)
        gl.uniform2f(uScale, X_SCALE, yScale);

        //send planets information to uniform
        for(let i=0; i<currentPlanets; i++) {
            const uPlanetsPos = gl.getUniformLocation(updateProgram, "uPlanetsPos[" + i + "]");
            const uPlanetsR = gl.getUniformLocation(updateProgram, "uPlanetsR[" + i + "]");
            const uPlanetsType = gl.getUniformLocation(updateProgram, "uPlanetsType[" + i + "]");
            gl.uniform2fv(uPlanetsPos, planetsPos[i]);
            gl.uniform1f(uPlanetsR, planetsR[i]);
            gl.uniform1f(uPlanetsType, planetsType[i]);
        }

        // Setup attributes
        const vPosition = gl.getAttribLocation(updateProgram, "vPosition");
        const vAge = gl.getAttribLocation(updateProgram, "vAge");
        const vLife = gl.getAttribLocation(updateProgram, "vLife");
        const vVelocity = gl.getAttribLocation(updateProgram, "vVelocity");
 
        gl.bindBuffer(gl.ARRAY_BUFFER, inParticlesBuffer);
        
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(vAge, 1, gl.FLOAT, false, 24, 8);
        gl.vertexAttribPointer(vLife, 1, gl.FLOAT, false, 24, 12);
        gl.vertexAttribPointer(vVelocity, 2, gl.FLOAT, false, 24, 16);
        
        gl.enableVertexAttribArray(vPosition);
        gl.enableVertexAttribArray(vAge);
        gl.enableVertexAttribArray(vLife);
        gl.enableVertexAttribArray(vVelocity);

        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, outParticlesBuffer);
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, N_PARTICLES);
        gl.endTransformFeedback();
        gl.disable(gl.RASTERIZER_DISCARD);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    }

    function swapParticlesBuffers()
    {
        let auxBuffer = inParticlesBuffer;
        inParticlesBuffer = outParticlesBuffer;
        outParticlesBuffer = auxBuffer;
    }

    function drawQuad() {
       
        const uScale = gl.getUniformLocation(fieldProgram, "uScale");
        const uCurrentPlanets = gl.getUniformLocation(fieldProgram, "uCurrentPlanets");

        gl.useProgram(fieldProgram);

        gl.uniform2fv(uScale, vec2(X_SCALE, yScale));
        gl.uniform1f(uCurrentPlanets, currentPlanets)

        //send planets information to uniform
        for(let i=0; i<currentPlanets; i++) {
            const uPlanetsPos = gl.getUniformLocation(fieldProgram, "uPlanetsPos[" + i + "]");
            const uPlanetsR = gl.getUniformLocation(fieldProgram, "uPlanetsR[" + i + "]");
            const uPlanetsType =  gl.getUniformLocation(fieldProgram, "uPlanetsType[" + i + "]");

            gl.uniform2fv(uPlanetsPos, planetsPos[i]);
            gl.uniform1f(uPlanetsR, planetsR[i]); 
            gl.uniform1f(uPlanetsType, planetsType[i]);
        }

        // Setup attributes
        const vPosition = gl.getAttribLocation(fieldProgram, "vPosition"); 

        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.enableVertexAttribArray(vPosition);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function drawParticles(buffer, nParticles)
    {
        const uScale = gl.getUniformLocation(renderProgram, "uScale");

        gl.useProgram(renderProgram);

        gl.uniform2fv(uScale, vec2(X_SCALE, yScale));

        // Setup attributes
        const vPosition = gl.getAttribLocation(renderProgram, "vPosition");

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.drawArrays(gl.POINTS, 0, nParticles);
    }

    /**
     * Returns a random number between max (inclusive) and min (inclusive)
     * @param {*} min min value
     * @param {*} max min value
     * @returns a random number between max (inclusive) and min (inclusive)
     */
    function randomNumBetween(min, max) {
        return Math.random()*(max-min) + min;

    }

    function updateLabels(){
        document.getElementById('nPlanets').innerHTML = currentPlanets;
        document.getElementById('minVel').innerHTML = minVelocity.toFixed(2);
        document.getElementById('maxVel').innerHTML = maxVelocity.toFixed(2);
        document.getElementById('minLife').innerHTML = minLife;
        document.getElementById('maxLife').innerHTML = maxLife;
    }
}


loadShadersFromURLS([
    "field-render.vert", "field-render.frag",
    "particle-update.vert", "particle-update.frag", 
    "particle-render.vert", "particle-render.frag"
    ]
).then(shaders=>main(shaders));