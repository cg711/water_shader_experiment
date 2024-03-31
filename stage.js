import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { degToRad } from 'three/src/math/MathUtils';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import { syllable } from 'syllable';


function animate() {
    requestAnimationFrame(animate);
    waterShader.uniforms.uTime.value += 0.005;
    if(duck != null) {
        duck.position.y = Math.sin(clock.getElapsedTime()) * 0.1;
    }
    renderer.render(scene, camera);
    // controls.update();
}

const scene = new THREE.Scene();
const clock = new THREE.Clock();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(-1, 1.3, 4);
camera.rotation.set(0, degToRad(-45),0);



// Define the custom shader material
const waterShader = {
    uniforms: {
      uTime: { value: 0.0 },
      uResolution: { value: new THREE.Vector2() },
      uTexture: { value: new THREE.TextureLoader().load("textures/sky_test_up.png"),
     }
    },
    // wireframe: true,
    vertexShader: /*glsl*/`

    #define PI 3.1415926
    #define PI2 PI*2.
    uniform float uTime;
    varying float height;

    float random (vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float noise (vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        // Four corners in 2D of a tile
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        // Smooth Interpolation

        // Cubic Hermine Curve.  Same as SmoothStep()
        vec2 u = f*f*(3.0-2.0*f);

        // Mix 4 coorners percentages
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    mat2 rotate2d(float angle){
        return mat2(cos(angle),-sin(angle),
                  sin(angle),cos(angle));
    }

    void main(){

      vec3 pos = position;
      pos.z += 0.3 * noise(pos.xy + uTime * 0.8);
      pos.z += 0.3 * noise(rotate2d(PI / 4.) * pos.yx - uTime * 0.8);
      height = pos.z;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
    `,
    fragmentShader: /*glsl*/`
    // "Wind Waker Ocean" by @Polyflare (29/1/15)
    // License: Creative Commons Attribution 4.0 International
    
    // Source code for the texture generator is available at:
    // https://github.com/lmurray/circleator
    
    //-----------------------------------------------------------------------------
    // User settings
    
    // 0 = No antialiasing
    // 1 = 2x2 supersampling antialiasing
    #define ANTIALIAS 1
    
    // 0 = Static camera
    // 1 = Animate the camera
    #define ANIMATE_CAM 0
    
    // 0 = Do not distort the water texture
    // 1 = Apply lateral distortion to the water texture
    #define DISTORT_WATER 1
    
    // 0 = Disable parallax effects
    // 1 = Change the height of the water with parallax effects
    #define PARALLAX_WATER 1
    
    // 0 = Antialias the water texture
    // 1 = Do not antialias the water texture
    #define FAST_CIRCLES 1
    
    uniform float uTime;
    uniform vec2 uResolution;
    
    //-----------------------------------------------------------------------------
    
    #define WATER_COL vec3(0.0, 0.6, 0.7305)
    #define WATER2_COL vec3(0.0, 0.4180, 0.6758)
    #define FOAM_COL vec3(0.8125, 0.9609, 0.9648)
    #define FOG_COL vec3(0.6406, 0.9453, 0.9336)
    #define SKY_COL vec3(0.0, 0.8203, 1.0)
    
    #define M_2PI 6.283185307
    #define M_6PI 18.84955592
    
    float circ(vec2 pos, vec2 c, float s)
    {
        c = abs(pos - c);
        c = min(c, 1.0 - c);
    #if FAST_CIRCLES
        return dot(c, c) < s ? -1.0 : 0.0;
    #else
        return smoothstep(0.0, 0.002, sqrt(s) - sqrt(dot(c, c))) * -1.0;
    #endif
    }
    
    // Foam pattern for the water constructed out of a series of circles
    float waterlayer(vec2 uv)
    {
        uv = mod(uv, 1.0); // Clamp to [0..1]
        float ret = 1.0;
        ret += circ(uv, vec2(0.37378, 0.277169), 0.0268181);
        ret += circ(uv, vec2(0.0317477, 0.540372), 0.0193742);
        ret += circ(uv, vec2(0.430044, 0.882218), 0.0232337);
        ret += circ(uv, vec2(0.641033, 0.695106), 0.0117864);
        ret += circ(uv, vec2(0.0146398, 0.0791346), 0.0299458);
        ret += circ(uv, vec2(0.43871, 0.394445), 0.0289087);
        ret += circ(uv, vec2(0.909446, 0.878141), 0.028466);
        ret += circ(uv, vec2(0.310149, 0.686637), 0.0128496);
        ret += circ(uv, vec2(0.928617, 0.195986), 0.0152041);
        ret += circ(uv, vec2(0.0438506, 0.868153), 0.0268601);
        ret += circ(uv, vec2(0.308619, 0.194937), 0.00806102);
        ret += circ(uv, vec2(0.349922, 0.449714), 0.00928667);
        ret += circ(uv, vec2(0.0449556, 0.953415), 0.023126);
        ret += circ(uv, vec2(0.117761, 0.503309), 0.0151272);
        ret += circ(uv, vec2(0.563517, 0.244991), 0.0292322);
        ret += circ(uv, vec2(0.566936, 0.954457), 0.00981141);
        ret += circ(uv, vec2(0.0489944, 0.200931), 0.0178746);
        ret += circ(uv, vec2(0.569297, 0.624893), 0.0132408);
        ret += circ(uv, vec2(0.298347, 0.710972), 0.0114426);
        ret += circ(uv, vec2(0.878141, 0.771279), 0.00322719);
        ret += circ(uv, vec2(0.150995, 0.376221), 0.00216157);
        ret += circ(uv, vec2(0.119673, 0.541984), 0.0124621);
        ret += circ(uv, vec2(0.629598, 0.295629), 0.0198736);
        ret += circ(uv, vec2(0.334357, 0.266278), 0.0187145);
        ret += circ(uv, vec2(0.918044, 0.968163), 0.0182928);
        ret += circ(uv, vec2(0.965445, 0.505026), 0.006348);
        ret += circ(uv, vec2(0.514847, 0.865444), 0.00623523);
        ret += circ(uv, vec2(0.710575, 0.0415131), 0.00322689);
        ret += circ(uv, vec2(0.71403, 0.576945), 0.0215641);
        ret += circ(uv, vec2(0.748873, 0.413325), 0.0110795);
        ret += circ(uv, vec2(0.0623365, 0.896713), 0.0236203);
        ret += circ(uv, vec2(0.980482, 0.473849), 0.00573439);
        ret += circ(uv, vec2(0.647463, 0.654349), 0.0188713);
        ret += circ(uv, vec2(0.651406, 0.981297), 0.00710875);
        ret += circ(uv, vec2(0.428928, 0.382426), 0.0298806);
        ret += circ(uv, vec2(0.811545, 0.62568), 0.00265539);
        ret += circ(uv, vec2(0.400787, 0.74162), 0.00486609);
        ret += circ(uv, vec2(0.331283, 0.418536), 0.00598028);
        ret += circ(uv, vec2(0.894762, 0.0657997), 0.00760375);
        ret += circ(uv, vec2(0.525104, 0.572233), 0.0141796);
        ret += circ(uv, vec2(0.431526, 0.911372), 0.0213234);
        ret += circ(uv, vec2(0.658212, 0.910553), 0.000741023);
        ret += circ(uv, vec2(0.514523, 0.243263), 0.0270685);
        ret += circ(uv, vec2(0.0249494, 0.252872), 0.00876653);
        ret += circ(uv, vec2(0.502214, 0.47269), 0.0234534);
        ret += circ(uv, vec2(0.693271, 0.431469), 0.0246533);
        ret += circ(uv, vec2(0.415, 0.884418), 0.0271696);
        ret += circ(uv, vec2(0.149073, 0.41204), 0.00497198);
        ret += circ(uv, vec2(0.533816, 0.897634), 0.00650833);
        ret += circ(uv, vec2(0.0409132, 0.83406), 0.0191398);
        ret += circ(uv, vec2(0.638585, 0.646019), 0.0206129);
        ret += circ(uv, vec2(0.660342, 0.966541), 0.0053511);
        ret += circ(uv, vec2(0.513783, 0.142233), 0.00471653);
        ret += circ(uv, vec2(0.124305, 0.644263), 0.00116724);
        ret += circ(uv, vec2(0.99871, 0.583864), 0.0107329);
        ret += circ(uv, vec2(0.894879, 0.233289), 0.00667092);
        ret += circ(uv, vec2(0.246286, 0.682766), 0.00411623);
        ret += circ(uv, vec2(0.0761895, 0.16327), 0.0145935);
        ret += circ(uv, vec2(0.949386, 0.802936), 0.0100873);
        ret += circ(uv, vec2(0.480122, 0.196554), 0.0110185);
        ret += circ(uv, vec2(0.896854, 0.803707), 0.013969);
        ret += circ(uv, vec2(0.292865, 0.762973), 0.00566413);
        ret += circ(uv, vec2(0.0995585, 0.117457), 0.00869407);
        ret += circ(uv, vec2(0.377713, 0.00335442), 0.0063147);
        ret += circ(uv, vec2(0.506365, 0.531118), 0.0144016);
        ret += circ(uv, vec2(0.408806, 0.894771), 0.0243923);
        ret += circ(uv, vec2(0.143579, 0.85138), 0.00418529);
        ret += circ(uv, vec2(0.0902811, 0.181775), 0.0108896);
        ret += circ(uv, vec2(0.780695, 0.394644), 0.00475475);
        ret += circ(uv, vec2(0.298036, 0.625531), 0.00325285);
        ret += circ(uv, vec2(0.218423, 0.714537), 0.00157212);
        ret += circ(uv, vec2(0.658836, 0.159556), 0.00225897);
        ret += circ(uv, vec2(0.987324, 0.146545), 0.0288391);
        ret += circ(uv, vec2(0.222646, 0.251694), 0.00092276);
        ret += circ(uv, vec2(0.159826, 0.528063), 0.00605293);
        return max(ret, 0.0);
    }
    
    // Procedural texture generation for the water
    vec3 water(vec2 uv, vec3 cdir)
    {
        uv *= vec2(0.25);
        
    #if PARALLAX_WATER
        // Parallax height distortion with two directional waves at
        // slightly different angles.
        vec2 a = 0.025 * cdir.xz / cdir.y; // Parallax offset
        float h = sin(uv.x + uTime); // Height at UV
        uv += a * h;
        h = sin(0.841471 * uv.x - 0.540302 * uv.y + uTime);
        uv += a * h;
    #endif
        
    #if DISTORT_WATER
        // Texture distortion
        float d1 = mod(uv.x + uv.y, M_2PI);
        float d2 = mod((uv.x + uv.y + 0.25) * 1.3, M_6PI);
        d1 = uTime * 0.07 + d1;
        d2 = uTime * 0.5 + d2;
        vec2 dist = vec2(
            sin(d1) * 0.15 + sin(d2) * 0.05,
            cos(d1) * 0.15 + cos(d2) * 0.05
        );
    #else
        const vec2 dist = vec2(0.0);
    #endif
        
        vec3 ret = mix(WATER_COL, WATER2_COL, waterlayer(uv + dist.xy));
        ret = mix(ret, FOAM_COL, waterlayer(vec2(1.0) - uv - dist.yx));
        return ret;
    }
    
    // Camera perspective based on [0..1] viewport
    vec3 pixtoray(vec2 uv)
    {
        vec3 pixpos;
        pixpos.xy = uv - 0.5;
        pixpos.y *= uResolution.y / uResolution.x; // Aspect correction
        pixpos.z = -0.6; // Focal length (Controls field of view)
        return normalize(pixpos);
    }
    
    // Quaternion-vector multiplication
    vec3 quatmul(vec4 q, vec3 v)
    {
        vec3 qvec = q.xyz;
        vec3 uv = cross(qvec, v);
        vec3 uuv = cross(qvec, uv);
        uv *= (2.0 * q.w);
        uuv *= 2.0;
        return v + uv + uuv;
    }
    
    void main()
    {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    #if ANTIALIAS
        for(int y = 0; y < 2; y++) {
            for(int x = 0; x < 2; x++) {
                vec2 offset = vec2(0.5) * vec2(x, y) - vec2(0.25);
    #else
                vec2 offset = vec2(0.0);
    #endif
                // Camera stuff
                vec2 uv = (gl_FragCoord.xy + offset) / uResolution.xy;
                vec3 cpos = vec3(0.0, 16.0, 10.0); // Camera position
                vec3 cdir = pixtoray(uv);
                cdir = quatmul( // Tilt down slightly
                    vec4(-0.19867, 0.0, 0.0, 0.980067), cdir);
                // Ray-plane intersection
                const vec3 ocean = vec3(0.0, 1.0, 0.0);
                float dist = -dot(cpos, ocean) / dot(cdir, ocean);
                vec3 pos = cpos + dist * cdir;
    
                vec3 pix;
                if(dist > 0.0 && dist < 100.0) {
                    // Ocean
                    vec3 wat = water(pos.xz, cdir);
                    pix = mix(wat, FOG_COL, min(dist * 0.01, 1.0));
                } else {
                    // Sky
                    pix = mix(FOG_COL, SKY_COL, min(cdir.y * 4.0, 1.0));
                }
    #if ANTIALIAS
                gl_FragColor.rgb += pix * vec3(0.25);
            }
        }
    #else
        gl_FragColor.rgb = pix;
    #endif
    }
    
    `
};
  
  // Create the shader material
  const waterMaterial = new THREE.ShaderMaterial(waterShader);
  
  // Set resolution uniform value
  waterMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  waterMaterial.uniforms.uTexture.value.wrapS = THREE.ClampToEdgeWrapping;
  waterMaterial.uniforms.uTexture.value.wrapT = THREE.ClampToEdgeWrapping;

  const planeGeometry = new THREE.PlaneGeometry(100,100,16,16);

  // Create a mesh with the geometry and shader material
  const waterMesh = new THREE.Mesh(planeGeometry, waterMaterial);
  waterMesh.rotation.x = degToRad(270);
  // Add the mesh to the scene
  scene.add(waterMesh);

// Rubber Ducky
let duck;

const duckLoader = new GLTFLoader();
duckLoader.load("models/duck.glb", (obj) => {
    obj.scene.children[0].position.y = -0.05;
    obj.scene.children[0].scale.set(1.5,1.5,1.5);
    scene.add(obj.scene);
    duck = obj.scene;
}, (p) => {
    console.log("Duck OTW");
}, (e) => {console.log(e)});

const islandLoader = new GLTFLoader();
islandLoader.load("models/island.glb", (obj) => {
    obj.scene.position.set(9, -0.2, -10);
    scene.add(obj.scene);
}, (p) => {
    console.log("Island OTW");
}, (e) => {
    console.log(e);
});

// let loader = new THREE.CubeTextureLoader()
//     .setPath("textures/")
//     .load([
//         "sky_test_front.png",
//         "sky_test_back.png",
//         "sky_test_up.png",
//         "sky_test_down.png",
//         "sky_test_right.png",
//         "sky_test_left.png"

//     ]);
// scene.background = loader;
scene.background = new THREE.Color(0xcbf1f6);
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

const ambientLight = new THREE.HemisphereLight(0xFFFFFF, 0x75c5dd, 4);
ambientLight.position.set(0, 10, 10);
ambientLight.castShadow = true;
scene.add(ambientLight);

// animation loop

const renderer = new THREE.WebGLRenderer();

// controls
// let controls = new OrbitControls( camera, renderer.domElement );
// controls.minDistance = 0;
// controls.maxDistance = 300;

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


animate();

// Form logic

const button = document.querySelector("button");
const quacks = document.querySelectorAll("audio");
const input = document.querySelector("textarea");
const dialog = document.querySelector(".duck-container");
const duckText = document.querySelector(".duck-spoken");
const timeoutIds = [];

const WORD_TIME_GAP = 50;

button.addEventListener("click" , async (e) => {
    duckText.innerHTML = "";
    dialog.classList.add("hidden");
    dialog.classList.remove("visible");
    timeoutIds.forEach((id) => clearTimeout(id));
    e.preventDefault();
    if(input.value.length != 0) {
        dialog.classList.remove("hidden");
        dialog.classList.add("visible");
        let sybArr = input.value.split(" ").map((item) => {
            return {
                word: item,
                count: syllable(item)
            };
        });

        playWords(sybArr);
        // End dialog

        let id = setTimeout(() => {
            duckText.innerHTML = "";
            dialog.classList.add("hidden");
            dialog.classList.remove("visible");
        }, 5000);
        timeoutIds = [...timeoutIds, id];
    }
});

async function playWords(arr) {
    for (const wordObj of arr) {
        await playWordWithNoises(wordObj, 150, 225);
    }
}

function playWithDelay(delay) {
    return new Promise((resolve) => {
        setTimeout(() => {
            let index = Math.floor(Math.random() * 3);
            let quack = quacks[index];
            quack.play();
            resolve();
        }, delay);
    });
}
// Function to play noises for each syllable in a word with delays
async function playWordWithNoises(wordObj, syllableDelay, wordDelay) {
    const syllables = wordObj.count;

    // Play noises for each syllable
    for (let i = 0; i < syllables; i++) {
        await playWithDelay(i * syllableDelay);
    }

    duckText.innerHTML += ` ${wordObj?.word}`;

    // Introduce word delay
    await new Promise((resolve) => {
        setTimeout(resolve, wordDelay);
    });
}