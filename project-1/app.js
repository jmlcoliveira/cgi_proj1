import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from '../../libs/utils.js';
import { vec2, flatten, subtract, dot} from '../../libs/MV.js';

// Buffers: particles before update, particles after update, quad vertices
let inParticlesBuffer, outParticlesBuffer, quadBuffer;

// Particle system constants

// Total number of particles
const N_PARTICLES = 1000000;
const xScale = 1.5;
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
let mouseDown = 0;
let planetsPos = [];
let planetsR = [];


function main(shaders)
{
    // Generate the canvas element to fill the entire page
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    yScale = xScale * canvas.height/canvas.width;

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

    //planetBuffer = gl.createBuffer();

    buildQuad();
    buildParticleSystem(N_PARTICLES);

    window.addEventListener("resize", function(event) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        yScale = xScale * canvas.height/canvas.width;
        gl.viewport(0,0,canvas.width, canvas.height);
    });

    window.addEventListener("keydown", function(event) {
        console.log(event.key);
        switch(event.key) {
            case "PageUp":
                if(event.shiftKey && minVelocity+0.01<maxVelocity) {
                    minVelocity +=  0.01;
                    console.log("minV: %f", minVelocity)
                } else if(!event.shiftKey && minVelocity<maxVelocity+0.01) {
                    maxVelocity += 0.01;
                    console.log("maxV: %f", maxVelocity)
                }
                break;
            case "PageDown":
                if(event.shiftKey && minVelocity-0.01<maxVelocity && minVelocity>=0.02) {
                    minVelocity -= 0.01;
                    console.log("minV: %f", minVelocity)
                } else if(!event.shiftKey && minVelocity<maxVelocity-0.01 && maxVelocity>=0.02) {
                    maxVelocity -= 0.01;
                    console.log("maxV: %f", maxVelocity)
                }
                break;
            case "ArrowUp":
                if(fluxAngle < Math.PI)
                    fluxAngle += 0.05;
                else
                    fluxAngle = Math.PI;
                break;
            case "ArrowDown":
                if(fluxAngle > -Math.PI)
                    fluxAngle -= 0.05;
                else
                    fluxAngle = -Math.PI;
                break;
            case "ArrowLeft":
                velocityAngle += 0.05;
                break;
            case "ArrowRight":
                velocityAngle -= 0.05;
                break;
            case 'q':
                if(minLife<19 && minLife<maxLife){
                    minLife++;
                    console.log(minLife)
                }
                break;
            case 'a':
                if(minLife>1 && minLife<=maxLife){
                    minLife--;
                    console.log(minLife)
                }
                break;
            case 'w':
                if(maxLife<20 && minLife<=maxLife){
                    maxLife++;
                    console.log(maxLife)
                }
                break;
            case 's':
                if(maxLife>2 && minLife<maxLife){
                     maxLife--;
                     console.log(maxLife)
                }
                break;
            case '0':
                drawField = !drawField;
                break;
            case '9':
                drawPoints  = !drawPoints;
                break; 
            case 'Shift':
                break;
        }
    })
    
    canvas.addEventListener("mousedown", function(event) {
        if(currentPlanets < MAX_PLANETS){
            let p = getCursorPosition(canvas, event);
            p[0] = p[0]*xScale;
            p[1] = p[1]*yScale;
            planetsPos.push(p);
            mouseDown = 1;
            let r = Math.sqrt(Math.pow(planetsPos[currentPlanets][1] - p[1], 2) + Math.pow(planetsPos[currentPlanets][0] - p[0], 2));
            if(r != undefined) 
                planetsR[currentPlanets] = r;
            currentPlanets++;
        }
    });

    canvas.addEventListener("mousemove", function(event) {
        let p = getCursorPosition(canvas, event);
        const spawnPosition = gl.getUniformLocation(updateProgram, "spawnPosition");
        p[0] = p[0]*xScale;
        p[1] = p[1]*yScale;
        if(event.shiftKey) {
            gl.useProgram(updateProgram);
            gl.uniform2fv(spawnPosition, p);
        }
        if(mouseDown == 1 && currentPlanets-1 < MAX_PLANETS){
            let r = Math.sqrt(Math.pow(planetsPos[currentPlanets-1][1] - p[1], 2) + Math.pow(planetsPos[currentPlanets-1][0] - p[0], 2));
            if(r != undefined) 
                planetsR[currentPlanets-1] = r;
        }
    });

    canvas.addEventListener("mouseup", function(event) {
        mouseDown = 0;
        }
    )

    
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
            let x = (2.0*Math.random()-1)*xScale;
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
        //drawPlanets(planetBuffer, N_VERTICES * currentPlanets);

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

        gl.useProgram(updateProgram);

        gl.uniform1f(uDeltaTime, deltaTime);
        gl.uniform1f(uMaxLife, maxLife);
        gl.uniform1f(uMinLife, minLife);
        gl.uniform1f(uMaxVelocity, maxVelocity);
        gl.uniform1f(uMinVelocity, minVelocity);
        gl.uniform1f(uVelocityAngle, velocityAngle);
        gl.uniform1f(uFluxAngle, fluxAngle);
        gl.uniform1f(uCurrentPlanets, currentPlanets)

        for(let i=0; i<currentPlanets; i++) {
            const uPlanetsPos = gl.getUniformLocation(updateProgram, "uPlanetsPos[" + i + "]");
            const uPlanetsR = gl.getUniformLocation(updateProgram, "uPlanetsR[" + i + "]");
            gl.uniform2fv(uPlanetsPos, planetsPos[i]);
            gl.uniform1f(uPlanetsR, planetsR[i]);
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

        gl.uniform2fv(uScale, vec2(xScale, yScale));
        gl.uniform1f(uCurrentPlanets, currentPlanets)

        for(let i=0; i<currentPlanets; i++) {
            const uPlanetsPos = gl.getUniformLocation(fieldProgram, "uPlanetsPos[" + i + "]");
            const uPlanetsR = gl.getUniformLocation(fieldProgram, "uPlanetsR[" + i + "]");
            gl.uniform2fv(uPlanetsPos, planetsPos[i]);
            gl.uniform1f(uPlanetsR, planetsR[i]);
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

        gl.uniform2fv(uScale, vec2(xScale, yScale));

        // Setup attributes
        const vPosition = gl.getAttribLocation(renderProgram, "vPosition");

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.drawArrays(gl.POINTS, 0, nParticles);
    }
/*
    function drawPlanets(buffer, nPlanets){
         gl.useProgram(fieldProgram);

         gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

         const vPosition = gl.getAttribLocation(fieldProgram, "vPosition");
         const vRadius = gl.getAttribLocation(fieldProgram, "vRadius");

         gl.bufferData(gl.ARRAY_BUFFER, flatten(planets), gl.STATIC_DRAW);
         gl.vertexAttribPointer(vPosition, 1, gl.FLOAT, false, 0, 0);
         gl.drawArrays(gl.LINE_LOOP, 0, nPlanets);
    }
*/
    function randomNumBetween(min, max) {
        return Math.random()*(max-min) + min;
    }
}


loadShadersFromURLS([
    "field-render.vert", "field-render.frag",
    "particle-update.vert", "particle-update.frag", 
    "particle-render.vert", "particle-render.frag"
    ]
).then(shaders=>main(shaders));