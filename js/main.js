/**
 * @author naoki
 */

"use strict";

$(function (bb) {
	var canvas = $("#webglCanvas").get(0);
	canvas.width  = $("#canvasArea").width();
	canvas.height = $("#canvasArea").height();	
	
	var gl = initGL(canvas);
	var prgObj = initShaders(gl, "vertexShader", "fragmentShader");
	
	var rbSys = new RbodySystem();
	
	var att = {
		vertex   : gl.getAttribLocation(prgObj, "vertex"  ),
		normal   : gl.getAttribLocation(prgObj, "normal"  ),
		texCoord : gl.getAttribLocation(prgObj, "texCoord")
	};
	var uni = {
		projectionMatrix      : gl.getUniformLocation(prgObj, "projectionMatrix"     ),
		modelViewMatrix       : gl.getUniformLocation(prgObj, "modelViewMatrix"      ), 
		normalMatrix          : gl.getUniformLocation(prgObj, "normalMatrix"         ),
		enableLighting        : gl.getUniformLocation(prgObj, "enableLighting"       ),
		enableTexture         : gl.getUniformLocation(prgObj, "enableTexture"        ),
		lightDirection        : gl.getUniformLocation(prgObj, "lightDirection"       ),
		lightSourceDiffuse    : gl.getUniformLocation(prgObj, "lightSourceDiffuse"   ),
		lightSourceAmbient    : gl.getUniformLocation(prgObj, "lightSourceAmbient"   ),
		lightSourceSpecular   : gl.getUniformLocation(prgObj, "lightSourceSpecular"  ),
		frontMaterialDiffuse  : gl.getUniformLocation(prgObj, "frontMaterialDiffuse" ),
		frontMaterialAmbient  : gl.getUniformLocation(prgObj, "frontMaterialAmbient" ),
		frontMaterialSpecular : gl.getUniformLocation(prgObj, "frontMaterialSpecular"),
		color                 : gl.getUniformLocation(prgObj, "color"                ),
		texSampler            : gl.getUniformLocation(prgObj, "texSampler"           )
	};
	
	var sphere = new SolidSphere(rbSys.radius, 12, 6);
	var sphereBuf = {
		vertex   : new ArrayBuffer3f(gl, att.vertex),
		normal   : new ArrayBuffer3f(gl, att.normal),
		texCoord : new ArrayBuffer2f(gl, att.texCoord),
		index    : new ElementArrayBuffer1us(gl),
		tex2D    : new Tex2DBuffer(gl, 0, uni.texSampler)
	};
	sphereBuf.vertex  .setBuffer(gl, sphere.vertex   );
	sphereBuf.normal  .setBuffer(gl, sphere.normal   );
	sphereBuf.texCoord.setBuffer(gl, sphere.texCoord );
	sphereBuf.index   .setBuffer(gl, sphere.index    );
	sphereBuf.tex2D   .setBuffer(gl, "img/sintai.png");

	var cube = new WireCube([-1, -2, -1], [ 1,  2,  1]);
	var cubeBuf = {
		vertex : new ArrayBuffer3f(gl, att.vertex),
		index  : new ElementArrayBuffer1us(gl)
	};
	cubeBuf.vertex.setBuffer(gl, cube.vertex);
	cubeBuf.index .setBuffer(gl, cube.index );
	
	var MAX_LOOP = 5000;
	var TIME_OUT =   10;
	var loop  = 0;
	var angle = 0;
	var timer0 = new Timer();
	var timer1 = new Timer();

	(function drawLoop() {
		timer0.start();

		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.depthFunc(gl.LEQUAL);
		gl.cullFace(gl.BACK);
		gl.clearColor(1, 1, 1, 1);
		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		timer1.start();
		rbSys.update();
		timer1.stop();

		var  pM = mat4.frustum(-1, 1, -1, 1, 5, 40);
		var mvM = mat4.identity(mat4.create());
		mat4.translate(mvM, [0, 0, -15]); // mvM = mvM * T
		mat4.rotate(mvM, deg2rad(   30), [1, 0, 0]); // mvM = mvM * R
		mat4.rotate(mvM, deg2rad(angle), [0, 1, 0]); // mvM = mvM * R

		// projection matrix
		gl.uniformMatrix4fv(uni.projectionMatrix, false, pM);

		// Sphere
		gl.uniform1i(uni.enableLighting, 1);
		gl.uniform1i(uni.enableTexture , 0);
		gl.uniform3fv(uni.lightDirection      , [0.0, 0.0, 1.0     ]);
		gl.uniform4fv(uni.lightSourceDiffuse  , [1.0, 1.0, 1.0, 1.0]);
		gl.uniform4fv(uni.frontMaterialDiffuse, [1.0, 1.0, 1.0, 1.0]);
		gl.uniform4fv(uni.frontMaterialAmbient, [0.1, 0.1, 0.1, 1.0]);
		sphereBuf.vertex  .bind(gl);
		sphereBuf.normal  .bind(gl);
		sphereBuf.texCoord.bind(gl);
		sphereBuf.index   .bind(gl);
		sphereBuf.tex2D   .bind(gl);
		for (var i=0; i < rbSys.body.length; ++i) {
			var bi = rbSys.body[i];
			var mvMBody = bi.toGLM4x4();
			mat4.multiply(mvM, mvMBody, mvMBody); // mvM(body) = mvM(global) * mvM(body)

			gl.uniformMatrix4fv(uni.modelViewMatrix, false,             mvMBody);
			gl.uniformMatrix3fv(uni.normalMatrix   , false, normalMat3(mvMBody));
			gl.drawElements(gl.TRIANGLES, sphere.index.length, gl.UNSIGNED_SHORT, 0);
		}
		sphereBuf.vertex  .unbind(gl);
		sphereBuf.normal  .unbind(gl);
		sphereBuf.texCoord.unbind(gl);
		sphereBuf.index   .unbind(gl);
		sphereBuf.tex2D   .unbind(gl);

		// Cube
		gl.uniform1i(uni.enableLighting, 0);
		gl.uniform1i(uni.enableTexture , 0);
		gl.uniform4fv(uni.color, [0, 0, 0, 0.5]);
		gl.uniformMatrix4fv(uni.modelViewMatrix , false, mvM);
		cubeBuf.vertex.bind(gl);
		cubeBuf.index .bind(gl);
		gl.drawElements(gl.LINES, cube.index.length, gl.UNSIGNED_SHORT, 0);
		cubeBuf.vertex.unbind(gl);
		cubeBuf.index .unbind(gl);
		
		gl.flush();
		++loop;
		
		timer0.stop();
		var err = gl.getError();
		if (err != gl.NO_ERROR && err != gl.CONTEXT_LOST_WEBGL) {
			alert( WebGLDebugUtils.glEnumToString(err) );
		}
		
		var ela0 = Math.ceil(timer0.elapsedMsec());
		var ave0 = Math.ceil(timer0.elapsedTotalMsec() / loop);
		var ela1 = Math.ceil(timer1.elapsedMsec());
		var ave1 = Math.ceil(timer1.elapsedTotalMsec() / loop);
		
		//angle += 360 / 20 * Math.max(ave0, TIME_OUT) / 1000;
		
		ela0 = num2str(ela0, 4);
		ela1 = num2str(ela1, 4);
		ave0 = num2str(ave0, 4);
		ave1 = num2str(ave1, 4);
		$("#info").html(
			'<p>' + rbSys.body.length + ' bodies, step: ' + loop + '</p>' +
			'<p>' +  'R-body Elapsed: ' + ela1 + ' msec ' + '(ave. ' +  ave1 + ')' + '</p>' +
			'<p>' +  '+WebGL Elapsed: ' + ela0 + ' msec ' + '(ave. ' +  ave0 + ')' + '</p>'
		);

		var timeoutId = setTimeout(drawLoop, TIME_OUT);
		if (loop >= MAX_LOOP) clearTimeout(timeoutId);
	} ());
}); // end of $(document).ready(fuction(){});

/* 
 * 
 * Utility
 * 
 */
function deg2rad(deg) {
	return deg * Math.PI / 180;
}
function num2str(num, digit) {
	var str = num + "";
	while (str.length < digit)
		str = " " + str;
	return str.replace(/ /g, "&nbsp;");
}

/* 
 * 
 * Timer
 * 
 */
function Timer() {
	this.reset();
}
Timer.prototype.reset = function() {
	this.timeStart = 0;
	this.timeStop = 0;
	this.elapsed = 0;
	this.elapsedTotal = 0;
};
Timer.prototype.start = function() {
	this.timeStart = new Date().getTime();
	return this.timeStart;
};
Timer.prototype.stop = function() {
	this.timeStop = new Date().getTime();
	this.elapsed = this.timeStop - this.timeStart;
	this.elapsedTotal += this.elapsed;
	return this.timeStop;
};
Timer.prototype.elapsedMsec = function() {
	return this.elapsed;
};
Timer.prototype.elapsedTotalMsec = function() {
	return this.elapsedTotal;
};
