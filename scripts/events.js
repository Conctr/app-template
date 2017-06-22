// Constants
const EVENT_TIME = 6;
const URL = "https://api.staging.conctr.com/data/apps/04b4e5549f3f46f6a8cd1f97100995d8/devices/";

function loadEventsPage() {
    $(".eventBtn").click(function(event) {
        recordEvent($(this).attr("id"));
    });

    // Navigate to the factories page
    $("#dataBtn").click(function(event) {
    	window.location.hash = "dataView";
    });
}

//----------------------------
function recordEvent(eventType) {
    var targetSpeed = document.getElementById("targetSpeed").value;
    var speedRegex = /[0-9]+/;

    // Check that a valid speed has been set
    if (speedRegex.test(targetSpeed)) {
        targetSpeed = parseInt(targetSpeed);
    } else {
        alertify.error("Must set a target speed to record an event");
        return;
    }

    // Get current time
    var d = new Date();
    var t = d.getTime();

    sendToAgent({
        "_ts": t,
        "event": eventType,
        "target_speed": targetSpeed
    });
}

//----------------------------
function sendToAgent(body) {

    $.post(AGENT_URL + "/events", body, function(data, status) {
        if(data.message == "OK"){
            alertify.success("Successfully sent event");
        } else {
            alertify.error("Error while sending event");
            console.error(data);
            console.error(status);
        }
    });

}

//----------------------------
function sendToConctr(body) {

    var request = new XMLHttpRequest();
    request.open("POST", URL + DEVICE_ID, true);
    request.setRequestHeader("Content-type", "application/json");
    request.setRequestHeader("Authorization", "api:" + API_KEY);

    request.onreadystatechange = function(){
        if(request.readyState == 4 && 200 <= request.status && request.status < 300){
            console.log(request.responseText);
        }
    }

    body._model = "poc:v2";
    body._ts = new Date().toISOString();
    request.send(JSON.stringify(body));

}
