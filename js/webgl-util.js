/**
 * @author nk.nishizawa@gmail.com
 */

"use strict";

function initGL(canvas) {
	var DEBUG_MODE = false;

	var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl"); // A || B : if (A == true) return A else return B
	if ( !gl ) {
		alert('ERROR: WebGL is not available on your browser...orz');
		return null;
	}
	//set view port
	gl.viewportWidth  = canvas.width ;
	gl.viewportHeight = canvas.height;

	if (DEBUG_MODE) {
		console.log("webgl: DEBUG MODE");
		return WebGLDebugUtils.makeDebugContext(gl);
	}
	return gl;
}

function initShaders(gl, idVertexShader, idFragmentShader) {
	var vxsObj = createShaderObj(gl, idVertexShader  );
	var fgsObj = createShaderObj(gl, idFragmentShader);
	var prgObj = createProgramObj(gl, vxsObj, fgsObj);
	
	return prgObj;
	
	////////////////////
	// local function //
	////////////////////
	function createShaderObj(gl, elemId) {
		var elem = document.getElementById(elemId);
		if ( !elem ) {
			alert('ERROR: can not find element "id=' + elemId + '"');
			return; // will return undefined
		}
		
		// create shader object
		var shaderObj;
		console.log("webgl: create shader object ...");
		switch( elem.type ) {
			case "x-shader/x-vertex":
				shaderObj = gl.createShader(gl.VERTEX_SHADER);
				break;
			case "x-shader/x-fragment":
				shaderObj = gl.createShader(gl.FRAGMENT_SHADER);
				break;
			default:
				alert('ERROR: element type must be "x-shader/(x-vertex|x-fragment)"');
				return; // will return undefined
		}
		console.log("webgl: attach shader source code to shader object ...");
		gl.shaderSource(shaderObj, elem.text);
		console.log("webgl: compile shader source code ...");
		gl.compileShader(shaderObj);
		
		// check shader object status (compile)
		if ( !gl.getShaderParameter(shaderObj, gl.COMPILE_STATUS) ) {
			alert(gl.getShaderInfoLog(shaderObj));
			alert('ERROR: compile shader source code "element id=' + elem.id + ' type=' + elem.type + '"');
			return; // will return undefined
		}
		return shaderObj;
	}
	
	////////////////////
	// local function //
	////////////////////
	function createProgramObj(gl, vxsObj, fgsObj) {
		var prgObj = gl.createProgram();
		console.log("webgl: attach shader object to program object ...");
		gl.attachShader(prgObj, vxsObj);
		console.log("webgl: attach shader object to program object ...");
		gl.attachShader(prgObj, fgsObj);
		console.log("webgl: link program(vertex&fragment shader) object ...");
		gl.linkProgram(prgObj);
		// check program object status (link)
		if ( !gl.getProgramParameter(prgObj, gl.LINK_STATUS) ) {
			alert(gl.getProgramInfoLog(prgObj));
			alert("ERROR: link program object");
			return; // will return undefined
		}
		console.log("webgl: install program object as current rendering state ...");
	    gl.useProgram(prgObj);
		return prgObj;
	}
};

var ArrayBufferBase = function () {/* base class */};
ArrayBufferBase.prototype.initialize = function (buffer, bufferUsage, attLocation, dataStride, dataType) {
	this.buffer      = buffer;
	this.bufferUsage = bufferUsage; 
	this.attLocation = attLocation;
	this.dataStride  = dataStride;
	this.dataType    = dataType;
};
ArrayBufferBase.prototype.setBuffer = function (gl, data) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, this.bufferUsage);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
};
ArrayBufferBase.prototype.bind = function (gl) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	gl.enableVertexAttribArray(this.attLocation);
	gl.vertexAttribPointer(
		this.attLocation,
		this.dataStride, 
		this.dataType,
		false, 0, 0
	);
};
ArrayBufferBase.prototype.unbind = function (gl) {
	gl.disableVertexAttribArray(this.attLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

function ArrayBuffer3f(gl, attLocation) {
	this.initialize(
		//this.initizlize.call(this,
		gl.createBuffer(),
		gl.STATIC_DRAW,
		attLocation,
		3,
		gl.FLOAT
	);
}
ArrayBuffer3f.prototype = new ArrayBufferBase();

function ArrayBuffer2f(gl, attLocation) {
	this.initialize(
		//this.initizlize.call(this,
		gl.createBuffer(),
		gl.STATIC_DRAW,
		attLocation,
		2,
		gl.FLOAT
	);
}
ArrayBuffer2f.prototype = new ArrayBufferBase();

var ElementArrayBufferBase = function () {/* base class */};
ElementArrayBufferBase.prototype.initialize = function (buffer, bufferUsage) {
	this.buffer      = buffer;
	this.bufferUsage = bufferUsage; 
};
ElementArrayBufferBase.prototype.setBuffer = function (gl, data) {
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, this.bufferUsage);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};
ElementArrayBufferBase.prototype.bind = function (gl) {
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
};
ElementArrayBufferBase.prototype.unbind = function (gl) {
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};

function ElementArrayBuffer1us(gl) {
	this.initialize(
		gl.createBuffer(),
		gl.STATIC_DRAW
	);
}
ElementArrayBuffer1us.prototype = new ElementArrayBufferBase();

function Tex2DBuffer(gl, textureUnit, uniLocation) {
	this.initialize(gl, textureUnit, uniLocation);
}
Tex2DBuffer.prototype.initialize = function (gl, textureUnit, uniLocation) {
	this.img = new Image();
	this.texuture    = gl.createTexture();
	this.textureUnit = textureUnit;
	this.uniLocation = uniLocation;
};
Tex2DBuffer.prototype.setBuffer= function (gl, src) {
	var img = this.img;
	var texuture = this.texuture;
	this.img.onload = function () {
		console.log("webgl: Image finish loading ... " + new Date().toLocaleString());
		
		console.log("webgl: bind texture object to current TO(TEXTURE_2D) ...");
		gl.bindTexture(gl.TEXTURE_2D, texuture);
		console.log("webgl: attach image data to point(TEXTURE_2D) ...");
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);	
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);	
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		
		console.log("webgl: generate mipmap ...");
		gl.generateMipmap(gl.TEXTURE_2D);
		
		console.log("webgl: un-bind texture object ...");
		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	this.img.src = src;
	console.log("webgl: Image begin loading .... " + new Date().toLocaleString());
};
Tex2DBuffer.prototype.bind = function (gl) {
	gl.activeTexture(gl[ "TEXTURE" + this.textureUnit ]);
	gl.bindTexture(gl.TEXTURE_2D, this.texuture);
	
	gl.uniform1i(this.uniLocation, this.textureUnit);
};
Tex2DBuffer.prototype.unbind = function (gl) {
	gl.activeTexture(gl.TEXTURE0);
	//gl.bindTexture(gl.TEXTURE_2D, null);
};

var FrameBuffer = function (gl, width, height) {
	this.initialize(gl, width, height);
};
FrameBuffer.prototype.initialize = function (gl, width, height) {
	this.width  = width;
	this.height = height;

	// init texutre
	this.colorBuffer    = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.colorBuffer);  
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //LINEAR_MIPMAP_LINEAR
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null /* allocate only */);

	// init renderbuffer
	// renderbuffer is not used, but it is nesessory to depth test
	this.depthBuffer    = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

	// init framebuffer
	// framebuffer == logical buffer == color + depth + stencil (default : window-system-provided)
	this.frameBuffer = gl.createFramebuffer(); 
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
	gl.framebufferTexture2D   (gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D  , this.colorBuffer, 0); // attach frame buffer(color) -> texture
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT , gl.RENDERBUFFER, this.depthBuffer   ); // attach frame buffer(depth) -> render buffer

	gl.bindTexture(g.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
		alert('ERROR: Incomplete frame buffer object');
	}
};
FrameBuffer.prototype.bind = function() {
  this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
};
FrameBuffer.prototype.unbind = function() {
  this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
};

function Mat4Stack() {
	var _ary = new Array();
	_ary.push( mat4.identity(mat4.create()) );
	this.push = function () {
		var last = _ary[_ary.length-1];
		_ary.push( mat4.create(last) );
	};
	this.pop = function () {
		_ary.pop();
	};
	this.top = function () {
		return _ary[_ary.length-1];
	};
}

function normalMat3(m) {
	var invM = mat4.toInverseMat3(m);
	return mat3.transpose(invM); // nM = ( mvM ^-1 ) ^t
}

function SolidSpherex(radius, divX, divY) {
	var numX = divX + 1; // num vertex x
	var numY = divY + 1; // num vertex y
	this.vertex   = new Float32Array(numX * numY * 3);
	this.normal   = new Float32Array(numX * numY * 3);
	this.texCoord = new Float32Array(numX * numY * 2);
	this.index    = new Uint16Array(divX * divY * 2 * 3);
	// Y
	// ^
	// |
	// | 
	// +------> X
	// vertex & normal
	var dTheta = 2.0 * Math.PI / divX; // 0 -> 360 degrees
	var dPhi   =       Math.PI / divY; // 0 -> 180 degrees
	for (var j=0, ii=0; j <= divY; ++j) {
		var phi = j * dPhi ;
		var y = radius * Math.cos(phi);
		var r = radius * Math.sin(phi);
		for (var i=0; i <= divX; ++i) {
			var theta = i * dTheta;
			var x = r * Math.cos(theta);
			var z = r * Math.sin(theta);
			var invL = Math.sqrt(x*x + y*y + z*z);
			this.vertex[ii  ] = x;
			this.vertex[ii+1] = y;
			this.vertex[ii+2] = z;
			this.normal[ii  ] = x * invL;
			this.normal[ii+1] = y * invL;
			this.normal[ii+2] = z * invL;
			ii += 3;
		}
	}
	// texture
	var du = 1 / divX * 2;
	var dv = 1 / divY * 2;
	for (var j=0, ii=0; j <= divY; ++j) {
		var v = j * dv;
		for (var i=0; i <= divX; ++i) {
			var u = i * du;
			this.texCoord[ii++] = u;
			this.texCoord[ii++] = v;
		}
	}
	// index
	for (var j = 0, ii=0; j < divY; ++j) {
		for (var i = 0; i < divX; ++i) {
			var v = j * numX + i;
			// upper triangle
			this.index[ii++] = v;
			this.index[ii++] = v + 1;
			this.index[ii++] = v + numX + 1;
			// lower triangle
			this.index[ii++] = v;
			this.index[ii++] = v + numX + 1;
			this.index[ii++] = v + numX;
		}
	}
}

function WireCube(x0, x1) {
	this.vertex = new Float32Array(8 * 3);
	this.index  = new Uint16Array(6 * 4 * 2);
	for(var v=0, ii=0; v < 8; ++v) {
		var x = v & 1 ? x1[0] : x0[0];
		var y = v & 2 ? x1[1] : x0[1];
		var z = v & 4 ? x1[2] : x0[2];
		this.vertex[ii++] = x;
		this.vertex[ii++] = y;
		this.vertex[ii++] = z;
	}
	var face = new Array();
	// face -x
	face[0] = [0, 4, 6, 2];
	// face +x
	face[1] = [1, 3, 7, 5];
	// face -y
	face[2] = [0, 1, 5, 4];
	// face +y
	face[3] = [2, 6, 7, 3];
	// face -z
	face[4] = [0, 2, 3, 1];
	// face +z
	face[5] = [4, 5, 7, 6]; 
	for(var f=0, ii=0; f < 6; ++f) { 
		for(var v=0; v < 4; ++v) { 
			var b = v; 
			var e = ( b + 1 ) % 4;
			this.index[ii++] = face[f][b]; 
			this.index[ii++] = face[f][e]; 
		}
	}
}

function BoardZ(width, height) {
	this.vertex   = new Float32Array(4 * 3);
	this.texCoord = new Float32Array(4 * 2); 
	this.index    = new Uint16Array(6);

	var hW = 0.5 * width ;
	var hH = 0.5 * height;

	var x0 = - hW;
	var x1 = + hW;
	var y0 = - hH;
	var y1 = + hH;

	var tri = [0, 1, 3, 0, 3, 2]; // 2(lower, upper) triangle index
	// vertex, texture
	for (var i = 0; i < 4; ++i) {
		var swX = i & 1;
		var swY = i & 2;
		// vertex
		// Y
		// ^
		// |
		// | 
		// +------> X
		var x = swX ? x1 : x0;
		var y = swY ? y1 : y0;
		var z = 0;
		var ii = i * 3;
		this.vertex[ii  ] = x;
		this.vertex[ii+1] = y;
		this.vertex[ii+2] = z;

		// texture
		// +------> U
		// |
		// | 
		// V
		// V
		var u = swX ? 1 : 0;
		var v = swY ? 0 : 1;
		ii = i * 2;
		this.texCoord[ii  ] = u;
		this.texCoord[ii+1] = v;
	}
	// index
	for (var i = 0; i < 6; ++i) {
		var ii = i * 1;
		this.index[ii] = tri[i];
	}
}