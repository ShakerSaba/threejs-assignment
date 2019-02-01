//setup three.js elements
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer();
var popup = undefined;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor( 0xddddee, 1);
document.body.appendChild( renderer.domElement );

camera.position.z = 50;
/*---------------------------------------------*/

//create nodes for each element in the sample data
var contents = {};
$.getJSON("sample_pcap.json", function(data) {
    contents = data;

    //var scales = new Float32Array( 10 );
    for(var i=0;i<contents.length;++i){
        var pt_x = contents[i]["No."]; //ordered by number
        var pt_y = contents[i]["Time"]; //height determined by time
        
        var positions = new Float32Array(3);
        var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight; 

        //modify position so they are relative to size of window
        //note: rather brutish way to do so, and only works when screen is loaded (ie, not responsive)
        positions[0] = ((pt_x-contents.length/2)/contents.length)*w/13;
        positions[1] = pt_y/2 - h/51 + 2;
        positions[2] = 0;
        
        //Create each point, Add to Scene
        /*note: I realize that I could probably do this with all the point in a single "object"
        but it didn't work with my implementation of hovering and clicking for interaction*/
        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        var material = new THREE.PointsMaterial();
        material.color.setHex(0x3344cc);
        var points = new THREE.Points(geometry,material);
        scene.add(points);
    }
});

/*---------------------------------------------*/

//update highlighted nodes whenever mouse moves
function onMove(event) {
    event = event || window.event;
    //get mouse coordinates
    var posX = event.pageX;
    var posY = event.pageY;
    if (posX === undefined) {
        posX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        posY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight; 
    //convert to relative screen position
    posX -= w/2;
    posY -= h/2;
    posX= posX/12.2;
    posY= posY/-12.2;
    
    for(var i=0; i<scene.children.length; ++i){
        var child = scene.children[i];
        var childX = child.geometry.getAttribute("position").array[0];
        var childY = child.geometry.getAttribute("position").array[1];
        //get distance between mouse and point
        var dist = Math.sqrt(Math.pow(posX-childX,2)+Math.pow(posY-childY,2));
        child.currentHex = child.material.color.getHex();
        //note: tried to get this working with raytracing as well, but this method was fastest to get working
        if(dist<0.48){
            //change color to show highlighted
            child.material.color.setHex( 0xff6655 );
        }else{
            //change color to default
            child.material.color.setHex( 0x3344cc );
        }
        //rather redundant as it has to check and modify every single child in the scene when the cursor moves
    }
}

//open popup when highlighted node is clicked
function onClick(event) {
    var contents = {};
    $.getJSON("sample_pcap.json", function(data) {
        contents = data;
        if(popup){
            console.log("bye bye!");
            popup = undefined;
            var p = document.getElementById("popup");
            p.parentNode.removeChild(p);
        }

        //lazy recycling of code from last function
        event = event || window.event;
        var posX = event.pageX;
        var posY = event.pageY;
        if (posX === undefined) {
            posX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight; 
        var raw_x = posX;
        var raw_y = posY;
        posX -= w/2;
        posY -= h/2;
        posX= posX/12.2;
        posY= posY/-12.2;
        
        for(var i=0; i<scene.children.length; ++i){
            var child = scene.children[i];
            var childX = child.geometry.getAttribute("position").array[0];
            var childY = child.geometry.getAttribute("position").array[1];
            var dist = Math.sqrt(Math.pow(posX-childX,2)+Math.pow(posY-childY,2));
            child.currentHex = child.material.color.getHex();
            //create a new popup and add to page
            //note: only change here
            if(dist<.48){
                popup = document.createElement("DIV");
                popup.id = "popup";
                //fill in details of element
                popup.innerHTML =
                    "<strong>No: </strong>" + contents[i]["No."] + "<br>" + 
                    "<strong>Time: </strong>" + contents[i]["Time"] + "<br>" + 
                    "<strong>Source: </strong>" + contents[i]["Source"] + "<br>" + 
                    "<strong>Destination: </strong>" + contents[i]["Destination"] + "<br>" + 
                    "<strong>Protocol: </strong>" + contents[i]["Protocol"] + "<br>" + 
                    "<strong>Length: </strong>" + contents[i]["Length"]; 
                //position and add to page
                popup.style.top = raw_y+5 + "px";
                popup.style.left = raw_x*.87 + "px";
                document.body.appendChild(popup);
            }
        }
    });
}

//add interaction events to page
if (document.attachEvent){
    document.attachEvent('onmousemove', onMove);
    document.attachEvent('onclick', onClick);
}else{
    document.addEventListener('mousemove', onMove);
    document.addEventListener('click', onClick);
}

//get three.js elements going
function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
animate();