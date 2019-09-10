var flight_time;
var mtow_min;
var mtow_max;
var mtow_step;
var frame;
var payload;
var selected_battery;

var battery = [];
battery[0] = {
	name:"Panasonic NCR18650GA",
	weight:48,
	capacity:3.2
}
battery[1] = {
	name:"Aga Power 22000mAh",
	weight:417,
	capacity:22
}
battery[2] = {
	name:"Tattu 6s 10000mAh",
	weight:231,
	capacity:10	
}
function getParams(){
	flight_time = parseFloat(document.getElementById("flightTime").value);
	selected_battery = parseInt(document.getElementById("battery").value);
	mtow_min = parseFloat(document.getElementById("wMin").value);
	mtow_max = parseFloat(document.getElementById("wMax").value);
	mtow_step = parseFloat(document.getElementById("wStep").value);
	payload = parseFloat(document.getElementById("payload").value);
	var frame_option = document.getElementsByName("frame");
	for(var i=0; i<frame_option.length; i++){
		//console.log(frame_option[i].checked);
		if(frame_option[i].checked){
			frame = parseInt(frame_option[i].value);
		}
		if(frame == -1){
			frame = parseInt(document.getElementById("frame_custom").value);
		}
	}
	//console.log(selected_battery);
}

function HSVtoRGB(H,S,V){
	var hexRGB = "#cccccc";
	var C = V*S;
	var X = C*(1-Math.abs((H/60)%2-1));
	var m = V-C;
	var r,g,b;
	if(H<60){
		r = C;
		g = X;
		b = 0;
	}else if(H<120){
		r = X;
		g = C;
		b = 0;
	}else if(H<180){
		r = 0;
		g = C;
		b = X;
	}else if(H<240){
		r = 0;
		g = X;
		b = C;
	}else if(H<300){
		r = X;
		g = 0;
		b = C;
	}else{
		r = C;
		g = 0;
		b = X;
	}
	r = (r+m)*255;
	g = (g+m)*255;
	b = (b+m)*255;
	r = Math.round(r).toString(16);
	g = Math.round(g).toString(16);
	b = Math.round(b).toString(16);
	if (r.length == 1) r = "0" + r;
	if (g.length == 1) g = "0" + g;
	if (b.length == 1) b = "0" + b;
	hexRGB = "#" + r + g + b;
	//console.log("Warna: "+hexRGB);
	return hexRGB;
}

function mapTTW(ttw){
	var hue;
	var min = 1.8;
	var ideal = 2.0;
	var max = 3.0;
	// 1  : 0 (merah)
	// 2  : 90 (hijau)
	// 2,5: 60 (kuning)
	if(ttw<=min){
		// map 1..1,67 jadi 0..60
		hue = 60*(ttw-1)/(min-1);
	}else if(ttw<=ideal){
		// map 1,66667..2 jadi 60..90
		hue = 60+30*(ttw-min)/(ideal-min);
	}else if(ttw<=max){
		// map 2..2.5 jadi 90..60
		hue = 90-30*(ttw-2)/(max-ideal);
	}else{
		hue = 60;
	}
	return hue;

}
function generateBatteryList(){
	for(var i=0; i<battery.length;i++){
		var batteryList = document.getElementById("battery");
		var option = document.createElement("option");
		option.text = battery[i].name;
		option.value = i;
		batteryList.add(option);
	}
}
var info;
function addInfo(param,value,unit){
	info += param+": "+value+unit+"<br/>";
}
function calculate(mtow,motor_id){
	// calculate current
	var current = ((mtow/frame) * motor[motor_id].a * motor[motor_id].a + (mtow/frame) * motor[motor_id].b) * frame; // A
	var battery_capacity = 1.15 * current * (flight_time/60); // Ah
	var battery_parallel = Math.ceil(battery_capacity/battery[selected_battery].capacity);
	var battery_total = battery_parallel * motor[motor_id].battery;
	var drive_weight = battery_total * battery[selected_battery].weight + frame * motor[motor_id].weight;
	var frame_weight = mtow - 1.1*1.15*drive_weight/1000.0;
	var estimated_flight_time = 0.9 * 3600 * battery_parallel*battery[selected_battery].capacity / current;
	//console.log(motor[motor_id].weight );
	info = "";
	addInfo("MTOW",mtow.toFixed(2),"kg");
	addInfo("Current",current.toFixed(2),"A");
	var str = motor[motor_id].battery+"S"+battery_parallel+"P"; 
	addInfo("Battery",str,"");
	str = Math.floor(estimated_flight_time/60)+"m "+Math.floor(estimated_flight_time)%60+"s"; 
	addInfo("Flight Time",str,"");
	addInfo("Thrust to Weight",(frame*motor[i].max*0.95/mtow).toFixed(2),"");
	//info += "Current: "+current.toFixed(2)+"A<br/>";
	//info += "Battery: "+motor[motor_id].battery+"S"+battery_parallel+"P<br/>";
	//info += "Flight Time: "+Math.floor(estimated_flight_time/60)+"m "+Math.floor(estimated_flight_time)%60+"s<br/>";
	//info += "Thrust to Weight: "+(frame*motor[i].max*0.95/mtow).toFixed(2) ;
	return frame_weight;
}

function init(){
	//parseCSV("motors.csv",";");
	readTextFile();
	generateBatteryList();
}
function main(){
	var the_table = "<table>";
	var mtow;
	getParams();

	// Make table header
	the_table += "<tr align='center'><td>Motor</td><td>Propeller</td>";
	for(mtow=mtow_min;mtow<=mtow_max;mtow+=mtow_step){
		the_table += "<td>"+mtow.toFixed(2)+"kg</td>";
	}
		//HSVtoRGB(60,1,1);
	for(i=0;i<motor.length;i++){
		//console.log(motor[i].name);
		the_table += "<tr align='center'>";
		the_table += "<td>"+motor[i].name+"</td>";
		the_table += "<td>"+motor[i].propeller+"</td>";
		for(mtow=mtow_min;mtow<=mtow_max;mtow+=mtow_step){
			var frame_weight;// = frame*motor[i].max-mtow;
			var ttw = frame*motor[i].max*0.95/mtow;
			var color;
			//var info;
			frame_weight = calculate(mtow,i) - payload;
			if(ttw<=1.0 || frame_weight<=0){
				color = "#cccccc";
			}else{
				color = HSVtoRGB(mapTTW(ttw),0.4,1);
			}
			the_table += "<td bgcolor='"+color+"' class='ht'>"+frame_weight.toFixed(2)+"<div class='tooltip'>"+info+"</div></td>";
		}
		the_table += "</tr>";
	}
	the_table += "</tr>";

	//table content

	// end of table
	the_table += "</table>";
	document.getElementById("theTable").innerHTML = the_table;
}