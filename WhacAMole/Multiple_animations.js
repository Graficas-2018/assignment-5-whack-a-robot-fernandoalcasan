var renderer = null,
scene = null,
camera = null,
root = null,
robot_idle = null,
group = null,
killed = false;

var raycaster;
var mouse = new THREE.Vector2(), CLICKED;

var floor = null;
var loader = null;
var tgaLoader = null;
var objLoader = null;
var robots = [];
var robotsIS = null;
var spots = [];
var animaciones = {};
var mixers = [];
var started = false;
var score = 0;
var initialTime = (Date.now()/1000);
var elapsedTime = 0;
var maxTime = 60;

var duration = 10; // ms
var spawn = 1; //s
var spawnTime = (Date.now()/1000) + spawn;
var ttl = 4; //s
var deleteTime = (Date.now()/1000) + ttl;
var currentTime = Date.now();

var animation = "idle";

function startGame()
{
    spawnTime = (Date.now()/1000) + spawn;
    deleteTime = (Date.now()/1000) + ttl;
    currentTime = Date.now();
    initialTime = (Date.now()/1000);
    elapsedTime = 0;
    score = 0;
    started = true;
    updateTimer(maxTime);
    updateScore(0);
    document.getElementById("startButton").style.display = "none";
}

function restartGame()
{
    document.getElementById("startButton").style.display = "none";
    startGame();
}

function onDocumentMouseDown(event)
{
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( robots, true);

    if ( intersects.length > 0 )
    {
        if(!killed && !intersects[ 0 ].object.parent.clicked)
        {
            killed = true;
            CLICKED = intersects[ 0 ].object;
            console.log("Intersectado!!!!!");
            CLICKED.parent.muerte.start();
            mixers[mixers.indexOf(CLICKED.parent.mixer)].clipAction(animaciones.dead).play();
            CLICKED.parent.clicked = true;
            var spotNum = CLICKED.parent.spotN;

            setTimeout(function()
            {
              console.log("Eliminado!");
              spots[spotNum].ocupado = false;
              robotsIS.remove(CLICKED.parent);
              robots.splice(robots.indexOf(CLICKED.parent), 1);
              score++;
              updateScore(score);
              killed = false;
            }, 800);
        }
    }
}

function piso(obj)
{
  this.objeto = obj;
  this.ocupado = false;
}

function loadFloor()
{
  loadObj(0, -23);
  loadObj(-30, -23);
  loadObj(30, -23);
  loadObj(0, 0);
  loadObj(-30, 0);
  loadObj(30, 0);
  loadObj(0, 23);
  loadObj(-30, 23);
  loadObj(30, 23);
}

function loadObj(x,z)
{
    if(!objLoader)
        objLoader = new THREE.OBJLoader();
    if(!tgaLoader)
        tgaLoader = new THREE.TGALoader();

    objLoader.load(
        '../models/floor/Sci-Fi-Floor-1-OBJ.obj',

        function(object)
        {
            var texture = tgaLoader.load(
              '../models/floor/Sci-Fi-Floor-Diffuse.tga',
              function ( texture ) {

                console.log( 'Texture is loaded' );

              },
              function ( xhr ) {

                  console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

              },
              // called when loading has errors
              function ( error ) {

                  console.log( 'An error happened' );

              }
            );

            var normalMap = tgaLoader.load(
              '../models/floor/Sci-Fi-Floor-Normal.tga',
              function ( texture ) {

                console.log( 'Texture is loaded' );

              },
              function ( xhr ) {

                  console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

              },
              // called when loading has errors
              function ( error ) {

                  console.log( 'An error happened' );

              }
            );

            var specularMap = tgaLoader.load(
              '../models/floor/Sci-Fi-Floor-Specular.tga',
              function ( texture ) {

                console.log( 'Texture is loaded' );

              },
              function ( xhr ) {

                  console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

              },
              // called when loading has errors
              function ( error ) {

                  console.log( 'An error happened' );

              }
            );

            var emissiveMap = tgaLoader.load(
              '../models/floor/Sci-Fi-Floor-Emissive.tga',
              function ( texture ) {

                console.log( 'Texture is loaded' );

              },
              function ( xhr ) {

                  console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

              },
              // called when loading has errors
              function ( error ) {

                  console.log( 'An error happened' );

              }
            );

            object.traverse( function ( child )
            {
                if ( child instanceof THREE.Mesh )
                {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material.map = texture;
                    child.material.normalMap = normalMap;
                    child.material.specularMap = specularMap;
                    child.material.emissiveMap = emissiveMap;

                }
            } );

            floor = new piso(object);
            floor.objeto.scale.set(8,8,8);
            floor.objeto.position.z = z;
            floor.objeto.position.x = x;
            floor.objeto.position.y = -4;
            spots.push(floor);
            scene.add(object);
        },
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        });
}


function removeRobot()
{
    if(robotsIS.children.length > 0)
    {
      var fled = robotsIS.children[0];
      spots[fled.spotN].ocupado = false;
      robotsIS.remove(fled);
      robots.splice(robots.indexOf(fled), 1);

      /*fled.muerte.start()

      setTimeout(function()
      {
        spots[fled.spotN].ocupado = false;
        robotsIS.remove(fled);
        robots.splice(robots.indexOf(fled), 1);
      }, 1000);*/
    }
}

function loadRobot(spot)
{
    if(spots[spot].ocupado)
    {
      return;
    }

    spots[spot].ocupado = true;
    console.log("Cloning robot");
    var newRobot = cloneFbx(robot_idle);
    newRobot.position.x = spots[spot].objeto.position.x;
    newRobot.position.z = spots[spot].objeto.position.z;
    newRobot.spotN = spot;
    newRobot.muerte = animacionMuerte(newRobot);
    newRobot.clicked = false;
    var newmixer = new THREE.AnimationMixer( newRobot );
    newmixer.clipAction(animaciones.idle).play();
    mixers.push(newmixer);
    newRobot.mixer = newmixer;
    robots.push(newRobot);
    robotsIS.add(newRobot);
    console.log(robotsIS);
}

function getSpot()
{
    for (var i = 0; i < spots.length; i++)
    {
        if(!spots[i].ocupado)
        {
          return i;
        }
    }

    return Math.floor(Math.random() * (9));
}

function loadFBX()
{
    var loader = new THREE.FBXLoader();
    loader.load( '../models/Robot/robot_run.fbx', function ( object )
    {
        object.scale.set(0.02, 0.02, 0.02);
        object.position.y -= 4;
        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );

        robot_idle = object;
        animaciones.idle = object.animations[0];

        loader.load( '../models/Robot/robot_atk.fbx', function ( object )
        {
            animaciones.dead = object.animations[0];
        } );
    } );
}

function animacionMuerte(obj)
{
    var deadAnimator = new KF.KeyFrameAnimator;
    deadAnimator.init({
        interps:
            [
                {
                    keys:[0, .1666, .3322, 0.4988, .6444, .8, 1],
                    values:[
                            { z : obj.position.z + 0, y : -4 },
                            { z : obj.position.z + 1.0, y : -3.17 },
                            { z : obj.position.z + 2.0, y : -2.34 },
                            { z : obj.position.z + 3.0, y : -1.51 },
                            { z : obj.position.z + 4.0, y : -0.68 },
                            { z : obj.position.z + 5.0, y : 0.15 },
                            { z : obj.position.z + 6.0, y : 1.0 },
                            ],
                    target:obj.position
                },
                {
                    keys:[0, .1666, .3322, 0.4988, .6444, .8, 1],
                    values:[
                            { x : 0 },
                            { x : -0.25 },
                            { x : -0.5 },
                            { x : -0.75 },
                            { x : -1.0 },
                            { x : -1.25 },
                            { x : -1.5 },
                            ],
                    target:obj.rotation
                },
            ],
        loop: false,
        duration:duration * 50,
    });

    return deadAnimator;
}

function animate() {

    var now = Date.now();
    var deltat = now - currentTime;
    currentTime = now;
    var second = (Date.now()/1000);
    elapsedTime = second - initialTime;

    if(robot_idle)
    {
        for(var mixer of mixers)
        {
          mixer.update(deltat * 0.001);
        }
    }

    KF.update();

    if((Date.now()/1000) >= spawnTime)
    {
        if(robot_idle)
          loadRobot(getSpot());

        spawnTime += spawn;
    }

    if((Date.now()/1000) >= deleteTime)
    {
        removeRobot();
        deleteTime += ttl;
    }

    if(elapsedTime > maxTime)
    {
        started = false;
        robots = [];
        mixers = [];
        scene.remove(robotsIS);
        robotsIS = new THREE.Object3D;
        scene.add(robotsIS);
        for (var i = 0; i < spots.length; i++)
        {
            spots[i].ocupado = false;
        }
        updateTimer(0);
        document.getElementById("startButton").innerHTML = "Restart Game";
        document.getElementById("startButton").style.display = "block";
    }
    else
    {
        updateTimer(Math.trunc(maxTime - elapsedTime) + 1);
    }


    //console.log('hola ' + (Date.now()/1000));
}

function run() {
    requestAnimationFrame(function() { run(); });

        // Render the scene
        renderer.render( scene, camera );

        // Spin the cube for next frame
        if(started)
          animate();
}

function setLightColor(light, r, g, b)
{
    r /= 255;
    g /= 255;
    b /= 255;

    light.color.setRGB(r, g, b);
}

function updateTimer(time)
{
    document.getElementById("timer").innerHTML = "Time: "+ time;
}

function updateScore(num)
{
    document.getElementById("score").innerHTML = "Score: "+ num;
}

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "../images/metalfloor.jpg";

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas) {

    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(0, 80, 65);
    camera.rotation.set(-0.9,0,0);
    scene.add(camera);

    // Create a group to hold all the objects
    root = new THREE.Object3D;

    spotLight = new THREE.SpotLight (0xffffff);
    spotLight.position.set(0, 80, 0);
    spotLight.target.position.set(0, -4, 0);
    root.add(spotLight);

    spotLight.castShadow = true;

    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 200;
    spotLight.shadow.camera.fov = 45;

    spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    ambientLight = new THREE.AmbientLight ( 0xffffff );
    root.add(ambientLight);

    // Create the objects
    loadFBX();

    loadFloor();

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    robotsIS = new THREE.Object3D;

    // Create a texture map
    var map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    var color = 0xffffff;

    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4;

    // Add the mesh to our group
    group.add( mesh );
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    // Now add the group to our scene
    scene.add( root );
    scene.add(robotsIS);

    raycaster = new THREE.Raycaster();
    document.addEventListener('mousedown', onDocumentMouseDown);
    //console.log(spots);
}
