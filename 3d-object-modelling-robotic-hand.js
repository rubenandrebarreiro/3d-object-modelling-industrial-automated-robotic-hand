// FCT NOVA | FCT-UNL (Faculty of Sciences and Technology of New University of Lisbon)
// Integrated Master (BSc./MSc.) of Computer Engineering

// Computer Graphics and Interfaces (2016-2017)

// Lab Work 3 - 3D Object Modelling - Industrial Automated Robotic Hand

// Daniel Filipe Pimenta - no. 45404 - d.pimenta@campus.fct.unl.pt
// Ruben André Barreiro - no. 42648 - r.barreiro@campus.fct.unl.pt

var gl;

var canvas;

// GLSL programs
var program;

// Render Mode
var FILLED = 0;
var WIREFRAME = 1;
var renderMode = FILLED;

var projection;
var modelView;
var view;

matrixStack = [];

var baseTranslationX = 0;      // base translationX,   keys 'up' and 'down' arrows
var baseTranslationZ = 0;      // base translationZ,   keys 'left' and 'right' arrows
var armRotation = 0;           // arm rotation,        keys 'Q' and 'W'
var lowerJointRotation = 0;    // lower join rotation, keys 'Z' and 'X'
var upperJointRotation = -50;  // upper join rotation, keys 'A' and 'S'
var clawTranslation = 0;       // claws translation,   keys 'O' and 'P'
var handRotation = 0;          // hand rotation,       keys 'K' and 'L'

function handleKeyboard() {
    window.onkeydown = function(e) {
        if (document.activeElement != document.getElementById("mainbody"))
            return;
            
        var e = (e || window.event);
        var keyCode = e.keyCode;
        
        switch(keyCode) {
            case 37:
                baseTranslationX = Math.max(-1.25, baseTranslationX-0.05); return;   // 37 = left-arrow  move the base to the left
            case 38:
                baseTranslationZ = Math.max(-1.25, baseTranslationZ-0.05); return;   // 38 = up-arrow  move the base to the right
            case 39:
                baseTranslationX = Math.min(baseTranslationX+0.05, 1.25); return;    // 39 = right-arrow  move a base para a direita
            case 40:
                baseTranslationZ = Math.min(baseTranslationZ+0.05, 1.25); return;    // 40 = down-arrow move a base para tras
            default:
                break;
        }
        
        var keyChar = String.fromCharCode(keyCode);
        
        switch (keyChar) {
            case "Q":
                armRotation = (armRotation+3) % 360; break;   // 'q' roda a base em sentido contrario aos ponteiros do relogio
            case "W":
                armRotation = (armRotation-3) % 360; break;  // 'w' roda a base em sentido dos ponteiros do relogio
            case "Z":
                lowerJointRotation = Math.min(lowerJointRotation+1, 61); break;      // 'z' roda a articulacao inferior para a esquerda
            case "X":
                lowerJointRotation = Math.max(-61, lowerJointRotation-1); break;      // 'x' roda a articulacao inferior para a direita
            case "A":
                upperJointRotation = Math.min(upperJointRotation+1, 61); break;      // 'a' roda a articulacao superior para a esquerda
            case "S":
                upperJointRotation = Math.max(-61, upperJointRotation-1); break;      // 's' roda a articulacao superior para a direita
            case "O":
                clawTranslation = Math.max(-0.09, clawTranslation-0.01);break;   // 'o' junta as garras
            case "P":
                clawTranslation = Math.min(clawTranslation+0.01, 0.09); break;   // 'p' afasta as garras
            case "K":
                handRotation = (handRotation+3) % 360; break;  // 'k' roda a mão em sentido contrario aos ponteiros do relogio
            case "L":
                handRotation = (handRotation-3) % 360; break;  // 'l' roda a mão em sentido dos ponteiros do relogio
            default:
                break;
        }
    }
}

function pushMatrix()
{
    matrixStack.push(mat4(modelView[0], modelView[1], modelView[2], modelView[3]));
}

function popMatrix()
{
    modelView = matrixStack.pop();
}

function multTranslation(t) {
    modelView = mult(modelView, translate(t));
}

function multRotX(angle) {
    modelView = mult(modelView, rotateX(angle));
}

function multRotY(angle) {
    modelView = mult(modelView, rotateY(angle));
}

function multRotZ(angle) {
    modelView = mult(modelView, rotateZ(angle));
}

function multMatrix(m) {
    modelView = mult(modelView, m);
}
function multScale(s) {
    modelView = mult(modelView, scalem(s));
}

function initialize() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader-2", "fragment-shader-2");

    cubeInit(gl);
    sphereInit(gl);
    cylinderInit(gl);

    setupProjection();
    setupView();

    handleKeyboard();
}

function setupProjection() {
    //projection = perspective(60, 1, 0.1, 100);
    projection = ortho(-1, 1, -1, 1, 0.1, 100);
}

function setupView() {
    view = lookAt([0,0,5], [0,0,0], [0,1,0]);
    modelView = mat4(view[0], view[1], view[2], view[3]);
}

function setMaterialColor(color) {
    var uColor = gl.getUniformLocation(program, "color");
    gl.uniform3fv(uColor, color);
}

function sendMatrices()
{
    // Send the current model view matrix
    var mView = gl.getUniformLocation(program, "mView");
    gl.uniformMatrix4fv(mView, false, flatten(view));

    // Send the normals transformation matrix
    var mViewVectors = gl.getUniformLocation(program, "mViewVectors");
    gl.uniformMatrix4fv(mViewVectors, false, flatten(normalMatrix(view, false)));

    // Send the current model view matrix
    var mModelView = gl.getUniformLocation(program, "mModelView");
    gl.uniformMatrix4fv(mModelView, false, flatten(modelView));

    // Send the normals transformation matrix
    var mNormals = gl.getUniformLocation(program, "mNormals");
    gl.uniformMatrix4fv(mNormals, false, flatten(normalMatrix(modelView, false)));
}

function draw_sphere(color)
{
    setMaterialColor(color);
    sendMatrices();
    if (renderMode == FILLED)
        sphereDrawFilled(gl, program);
    else
        sphereDrawWireFrame(gl, program);  
}

function draw_cube(color)
{
    setMaterialColor(color);
    sendMatrices();
    if (renderMode == FILLED)
         cubeDrawFilled(gl, program);
    else
        cubeDrawWireFrame(gl, program);
}

function draw_cylinder(color)
{
    setMaterialColor(color);
    sendMatrices();
    if (renderMode == FILLED)
        cylinderDrawFilled(gl, program); 
    else
         cylinderDrawWireFrame(gl, program);
}

function draw_scene()
{
    var sy = 0;
    var dy = 0;
    
    multTranslation([0, -0.5, 0]);
    multScale([0.35, 0.35, 0.35]);
    pushMatrix();
        multScale([4.0, sy=0.01, 4.0]);
        draw_cube([0.412, 0.412, 0.412]);
        // floor
    popMatrix();
    // move the base of robot
    multTranslation([baseTranslationX, 0.0, baseTranslationZ]);  
    pushMatrix();
        dy = dy+sy/2+(sy=0.2)/2;   // dy = 0.105
        multTranslation([0.0, dy, 0.0]);
        multScale([1.5, sy, 1.5]);
        draw_cube([1.0, 0.0, 0.0]);
        // base 
    popMatrix();
    // rotate arm of the robot
    multRotY(armRotation);  
    pushMatrix();
        dy = dy+sy/2+(sy=0.2)/2;  // dy = 0.305
        multTranslation([0.0, dy, 0.0]);
        multScale([0.5, sy, 0.5]);
        draw_cylinder([0.0, 1.0, 0.0]);
        // joint between arm and base
    popMatrix();
    pushMatrix();
        dy = dy+sy/2+(sy=0.5)/2;  // dy = 0.655
        multTranslation([0.0, dy, 0.0]);
        multScale([0.25, sy, 0.25]);
        draw_cube([1.0, 0.0, 0.0]);
        // lower arm
    popMatrix();
    // rotation of joint between bottom and middle arm
    dy = dy+sy/2;  // dy = 0.905
    multTranslation([0.0, dy, 0.0]);
    multRotZ(lowerJointRotation);
    multTranslation([0.0, -dy, 0.0]);
    pushMatrix(); 
        multTranslation([0.0, dy, 0.0]);
        multScale([0.3, sy=0.3, 0.3]);
        multRotX(90);
        draw_cylinder([0.0, 0.0, 1.0]);
        // joint between bottom and middle arm
    popMatrix();
    pushMatrix(); 
        dy = dy+(sy=0.8)/2;  // dy = 1.305
        multTranslation([0.0, dy, 0.0]);
        multScale([0.25, sy, 0.25]);
        draw_cube([1.0, 0.0, 0.0]);
         // middle arm
    popMatrix();
    // rotation of joint between middle and upper arm
    dy = dy+sy/2;  // dy = 1.705
    multTranslation([0.0, dy, 0.0]);
    multRotZ(upperJointRotation);
    multTranslation([0.0, -dy, 0.0]);
    pushMatrix();
        multTranslation([0.0, dy, 0.0]);
        multScale([0.3, sy=0.3, 0.3]);
        multRotX(90);
        draw_cylinder([0.8, 0.8, 0.0]);
        // joint between middle and upper arm
    popMatrix();    
    pushMatrix();
        dy = dy+(sy=1.2)/2;  // dy = 2.305
        multTranslation([0, dy, 0.0]);
        multScale([0.25, sy, 0.25]);
        draw_cube([1.0, 0.0, 0.0]);
        // upper arm 
    popMatrix();
    // rotation of hand
    multRotY(handRotation);
    pushMatrix();
        dy = dy+sy/2+(sy=0.3)/2;  // dy = 3.055
        multTranslation([0, dy, 0]);
        multScale([0.75, sy, 0.75]);
        draw_cylinder([0.752, 0.752, 0.752]);
        // hand
    popMatrix(); 
    pushMatrix();
        dy = dy+sy/2+(sy=0.5)/2;  // dy = 3.455
        multTranslation([-0.15-clawTranslation, dy, 0.0]);
        multScale([0.125, sy, 0.375]);
        draw_cube([0.8, 0.8, 0.0]);
        // left claw
    popMatrix(); 
        multTranslation([0.15+clawTranslation, dy, 0.0]);
        multScale([0.125, sy, 0.375]);
        draw_cube([0.8, 0.8, 0.0]);
        // right claw
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    setupView();

    // Send the current projection matrix
    var mProjection = gl.getUniformLocation(program, "mProjection");
    gl.uniformMatrix4fv(mProjection, false, flatten(projection));

    // Axonometric projection
    var gamma = document.getElementById("gamma").value;
    var theta = document.getElementById("theta").value;
    modelView = mult(modelView, mult(rotateX(gamma), rotateY(theta)));
    
    // Set render mode
    var renderList = document.getElementById("render");
    renderList.onchange = renderList.blur;
    renderMode = renderList.selectedIndex;
    
    draw_scene();

    requestAnimFrame(render);
}


window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }

    initialize();

    render();
}
