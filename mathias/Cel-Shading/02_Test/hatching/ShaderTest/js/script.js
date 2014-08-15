function initialisierung(){
        var noise = new ImprovedNoise();
        var renderer, scene, camera, mesh;
        var mesh, cube, pMesh, material;

        var fov = 120, nfov = 45;

        var onMouseDownMouseX = 0, onMouseDownMouseY = 0,
        lon = 0, onMouseDownLon = 0, nlat = 0,
        lat = 0, onMouseDownLat = 0, nlon = 0,
        phi = 0, theta = 0;
        lat = 15, isUserInteracting = false;

        var WIDTH = window.innerWidth;
        var HEIGHT = window.innerHeight;
        var colors = [ [ 0, 186, 233 ], [ 222, 0, 21 ], [ 233, 77, 0 ], [ 113, 206, 3 ], [ 219, 118, 255 ] ];

        var presets = {
            'Default': { ambient: 8, diffuse: 100, specular: 100, rim: 46, shininess: 49, invertRim: false, displayOutline: false, inkColor: [ 72, 72, 164 ] },
            'Sketch': { ambient: 9.8, diffuse: 100, specular: 100, rim: 81, shininess: 12, invertRim: true, displayOutline: false, inkColor: [ 175, 175, 175 ] },
            'Classroom': { ambient: 13, diffuse: 27, specular: 100, rim: 76, shininess: 27, invertRim: false, displayOutline: true, inkColor: [ 41, 41, 202 ] },
            'Engraving': { ambient: 0, diffuse: 57, specular: 100, rim: 77, shininess: 15, invertRim: true, displayOutline: false, inkColor: [ 90, 120, 111 ] }
        };

        var Settings = function() {
            this.ambient = 1;
            this.diffuse = 100;
            this.specular = 100;
            this.rim = 0;
            this.shininess = 100;
            this.invertRim = false;
            this.displayOutline = false;
            this.inkColor = [ 0, 0, 90 ];
            this.preset = 0;
        };
        
        // Temporaerer Namespace
        window.game = {};
        window.game.celShading = {};
        window.game.celShading.hatching = {};
        
        
        game.celShading.hatching.settings = new Settings();
        var gui = new dat.GUI();

        init();

        function init() {


            var presetSelector = {};
            for( var j in presets ) {
                presetSelector[ j ] = j;
            }

            gui.add(  game.celShading.hatching.settings, 'preset', presetSelector );
            gui.add(  game.celShading.hatching.settings, 'ambient', 0.0, 100.0 );
            gui.add(  game.celShading.hatching.settings, 'diffuse', 0.0, 100.0 );
            gui.add(  game.celShading.hatching.settings, 'specular', 0.0, 100.0 );
            gui.add(  game.celShading.hatching.settings, 'rim', 0.0, 100.0 );
            gui.add(  game.celShading.hatching.settings, 'shininess', 1, 100 );
            gui.add(  game.celShading.hatching.settings, 'invertRim' );
            gui.add(  game.celShading.hatching.settings, 'displayOutline' );
            gui.addColor(  game.celShading.hatching.settings, 'inkColor' );

            camera = new THREE.PerspectiveCamera( fov, WIDTH / HEIGHT, 1, 1000 );
            camera.position.z = 300;

            scene = new THREE.Scene();

            renderer = new THREE.WebGLRenderer( { antialias: true } );
            renderer.setSize( WIDTH, HEIGHT );
            renderer.autoClear = false;

            var container = document.getElementById( 'container' );
            container.appendChild( renderer.domElement );

            var id = 'hatch_';

            material = new THREE.ShaderMaterial( {

                uniforms:       {
                    showOutline: { type: 'f', value: 0 },
                    ambientWeight: { type: 'f', value : 0 },
                    diffuseWeight: { type: 'f', value : 1 },
                    rimWeight: { type: 'f', value : 1 },
                    specularWeight: { type: 'f', value : 1 },
                    shininess: { type: 'f', value : 1 },
                    invertRim: { type: 'i', value: 0 },
                    inkColor: { type: 'v4', value: new THREE.Vector3( 0, 0,0 ) },
                    resolution: { type: 'v2', value: new THREE.Vector2( 0, 0 ) },
                    bkgResolution: { type: 'v2', value: new THREE.Vector2( 0, 0 ) },
                    lightPosition: { type: 'v3', value: new THREE.Vector3( -100, 100, 0 ) },
                    hatch1: { type: 't', value: THREE.ImageUtils.loadTexture( id + '0.jpg' ) },
                    hatch2: { type: 't', value: THREE.ImageUtils.loadTexture( id + '1.jpg' ) },
                    hatch3: { type: 't', value: THREE.ImageUtils.loadTexture( id + '2.jpg' ) },
                    hatch4: { type: 't', value: THREE.ImageUtils.loadTexture( id + '3.jpg' ) },
                    hatch5: { type: 't', value: THREE.ImageUtils.loadTexture( id + '4.jpg' ) },
                    hatch6: { type: 't', value: THREE.ImageUtils.loadTexture( id + '5.jpg' ) },
                    repeat: { type: 'v2', value: new THREE.Vector2( 0, 0 ) }
                },
                vertexShader:   document.getElementById( 'vertexshader' ).textContent,
                fragmentShader: document.getElementById( 'fragmentshader' ).textContent

            });
            
            material.uniforms.repeat.value.set( 1,1 );
            material.uniforms.hatch1.value.wrapS = material.uniforms.hatch1.value.wrapT = THREE.RepeatWrapping;
            material.uniforms.hatch2.value.wrapS = material.uniforms.hatch2.value.wrapT = THREE.RepeatWrapping;
            material.uniforms.hatch3.value.wrapS = material.uniforms.hatch3.value.wrapT = THREE.RepeatWrapping;
            material.uniforms.hatch4.value.wrapS = material.uniforms.hatch4.value.wrapT = THREE.RepeatWrapping;
            material.uniforms.hatch5.value.wrapS = material.uniforms.hatch5.value.wrapT = THREE.RepeatWrapping;
            material.uniforms.hatch6.value.wrapS = material.uniforms.hatch6.value.wrapT = THREE.RepeatWrapping;

            hatchingVoreinstellung( 'Default' );            

            window.addEventListener( 'resize', onWindowResize, false );
            onWindowResize();
           
            container.addEventListener( 'mousedown', onTouchStart );
            container.addEventListener( 'touchstart', onTouchStart );

            function onTouchStart( event ) {

                var x, y;

                if( event.changedTouches ) {
                    x = event.changedTouches[ 0 ].pageX;
                    y = event.changedTouches[ 0 ].pageY;
                } else {
                    x = event.clientX;
                    y = event.clientY;
                }

                isUserInteracting = true;

                onPointerDownPointerX = x;
                onPointerDownPointerY = y;

                onPointerDownLon = lon;
                onPointerDownLat = lat;

                event.preventDefault();
            }

            container.addEventListener( 'mousemove', onTouchMove );
            container.addEventListener( 'touchmove', onTouchMove );
            
            			erstelleModel();

            function onTouchMove( event ) {

                if( event.changedTouches ) {
                    x = event.changedTouches[ 0 ].pageX;
                    y = event.changedTouches[ 0 ].pageY;
                } else {
                    x = event.clientX;
                    y = event.clientY;
                }


                if ( isUserInteracting ) {
                
                    nlon = ( x - onPointerDownPointerX ) * 0.5 + onPointerDownLon;
                    nlat = ( y - onPointerDownPointerY ) * 0.5 + onPointerDownLat;
                    
                }
                
                event.preventDefault();

            }

            container.addEventListener( 'mouseup', onTouchEnd );
            container.addEventListener( 'touchend', onTouchEnd );

            function onTouchEnd( event ) {

                if( isUserInteracting ) {
                    isUserInteracting = false;
                    event.preventDefault();
                }

            }

            container.addEventListener( 'mousewheel', onMouseWheel, false );
            container.addEventListener( 'DOMMouseScroll', onMouseWheel, false);

            function onMouseWheel( event ) {

                // WebKit

                if ( event.wheelDeltaY ) {

                    nfov -= event.wheelDeltaY * 0.01;

                // Opera / Explorer 9

                } else if ( event.wheelDelta ) {

                    nfov -= event.wheelDelta * 0.05;

                // Firefox

                } else if ( event.detail ) {

                    nfov += event.detail * 1.0;

                }
                
            }

            animate();

        }


        function turbulence( x, y, z ) {
            var t = -.5;
            for( var f = 1 ; f <= 100/12 ; f *= 2) {
                t += Math.abs( noise.noise( f * x, f * y, f * z ) / f );
            }
            return t;
        }

        function erstelleModel() {

            boxMesh = new THREE.Mesh( new THREE.BoxGeometry( 40, 40, 40 ), material );
            SphereMesh = new THREE.Mesh( new THREE.SphereGeometry( 20, 36, 36 ), material ); 
            TorusMesh = new THREE.Mesh( new THREE.TorusKnotGeometry( 25, 5, 100, 25, 1 ,3 ), material );

			boxMesh.position.z -= 40;
			TorusMesh.position.z += 40;

            scene.add( boxMesh );
            scene.add( SphereMesh );
            scene.add( TorusMesh );
        }

        function onWindowResize() {

            material.uniforms.resolution.value.set( window.innerWidth, window.innerHeight );

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize( window.innerWidth, window.innerHeight );

        }

        function animate() {
            
            render();
            requestAnimationFrame( animate );

        }

        function hexToRgb(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        function hatchingVoreinstellung( id ) {

            for( var j in presets[ id ] ) {
                 game.celShading.hatching.settings[ j ] = presets[ id ][ j ];
            }
            game.celShading.hatching.settings.preset = id;
             game.celShading.hatching.settings.currentPreset = id;

            for (var i in gui.__controllers) {
               gui.__controllers[i].updateDisplay();
            }

        }

        function render() {

            var pId =  game.celShading.hatching.settings.preset;
            if( pId !=  game.celShading.hatching.settings.currentPreset ) hatchingVoreinstellung( pId );
            
            var time = Date.now() * 0.005;

            nlat = Math.max( - 85, Math.min( 85, nlat ) );

            lat += ( nlat - lat ) * .1;
            lon += ( nlon - lon ) * .1;

            phi = ( 90 - lat ) * Math.PI / 180;
            theta = lon * Math.PI / 180;

            material.uniforms.ambientWeight.value =  game.celShading.hatching.settings.ambient / 100;
            material.uniforms.diffuseWeight.value =  game.celShading.hatching.settings.diffuse / 100;
            material.uniforms.rimWeight.value =  game.celShading.hatching.settings.rim / 100;
            material.uniforms.specularWeight.value =  game.celShading.hatching.settings.specular / 100;
            material.uniforms.shininess.value =  game.celShading.hatching.settings.shininess;
            material.uniforms.invertRim.value =  game.celShading.hatching.settings.invertRim?1:0;

            /*var c = hexToRgb(  game.celShading.hatching.settings.inkColor );
            material.uniforms.inkColor.value.set( c.r / 255, c.g / 255, c.b / 255, 1 );
            outlineMaterial.uniforms.inkColor.value.set( c.r / 255, c.g / 255, c.b / 255, 1 );*/

            material.uniforms.inkColor.value.set(  game.celShading.hatching.settings.inkColor[ 0 ] / 255,  game.celShading.hatching.settings.inkColor[ 1 ] / 255,  game.celShading.hatching.settings.inkColor[ 2 ] / 255, 1 );

            /*if( mesh ) {
                mesh.rotation.x += .01;
                mesh.rotation.y += .005;
                mesh.rotation.z += .007;

                var t = .001 * Date.now();
                mesh.material.uniforms.lightPosition.value.x = 100 * Math.cos( t );
                mesh.material.uniforms.lightPosition.value.z = 100 * Math.sin( t );
            }*/

            fov += ( nfov - fov ) * .1;
            camera.projectionMatrix.makePerspective( fov, window.innerWidth / window.innerHeight, 1, 1100 );

            var d = 300;
            camera.position.x = d * Math.sin( phi ) * Math.cos( theta );
            camera.position.y = d * Math.cos( phi );
            camera.position.z = d * Math.sin( phi ) * Math.sin( theta );

            camera.lookAt( scene.position );

            renderer.clear();
            if(  game.celShading.hatching.settings.displayOutline ) {
                material.depthWrite = false;
                material.uniforms.showOutline.value = 1;
                renderer.render( scene, camera );
            }
            material.depthWrite = true;
            material.uniforms.showOutline.value = 0;
            renderer.render( scene, camera );

        }
        }




