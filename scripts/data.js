// Constants
const MAX_BUFFER_SIZE = 50;

// Variables
var metrics = {
    acceleration_x:     {chart: null, buffer: [], max: 3, min: -3},
    acceleration_y:     {chart: null, buffer: [], max: 3, min: -3},
    acceleration_z:     {chart: null, buffer: [], max: 3, min: -3},
    angular_velocity_x: {chart: null, buffer: [], max: 100, min: -100},
    angular_velocity_y: {chart: null, buffer: [], max: 100, min: -100},
    angular_velocity_z: {chart: null, buffer: [], max: 100, min: -100},
    magnetism_x:        {chart: null, buffer: [], max: 0.5, min: -0.5},
    magnetism_y:        {chart: null, buffer: [], max: 0.5, min: -0.5},
    magnetism_z:        {chart: null, buffer: [], max: 0.5, min: -0.5},
    battery_voltage:    {chart: null, buffer: [], max: 4.3, min: 0}
};

var inEvent = false;
var clientDeviceDetails = null;

//----------------------------------
function loadDataPage() {
    initialise();
    poll();
}

//----------------------------------
function initialise() {
    // Initialise dropdown menu with existing events
    // Create request body
    const body = {
        "select":["event","_device_id","_ts"],
        "limit":100,
        "orderBy":[{"field":"_ts","desc":true}],
        "where":{
            // "_ts":
            //     {
            //         "type":"datetime",
            //         "gt":"2017-06-01T12:38:41+10:00"
            //     }
            }
        }

    // Create request parameters
    $.ajax({
        url: `https://api.staging.conctr.com/consumers/data/${CONCTR_APP_ID}/devices/historical/search/${DEVICE_ID}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `jwt:${localStorage.getItem("jwt")}`
        },
        method: 'POST',
        data: JSON.stringify(body),
        success: function(resp) {
            document.getElementById('eventDropdown').innerHTML = '<option value="live">Live Data</option>';
            for (entry of resp.data.historical) {
                if ("event" in entry) {
                    var eventOption = document.createElement("option");
                    eventOption.value = entry.event + " | " + entry._ts;
                    eventOption.innerHTML = entry.event + " | " + entry._ts;
                    document.getElementById('eventDropdown').appendChild(eventOption);
                }
            }
        },
        error: function(err) {
            console.log(JSON.stringify(err));
        }
    });

    // Initialise Highcharts charts for all metrics
    for (var metric in metrics) {
        metrics[metric].chart = Highcharts.chart(metric, {
            type: 'spline',
            animation: Highcharts.svg,
            title: { text: metric },
            yAxis: {max: metrics[metric].max, min: metrics[metric].min},
            series: [
                {data: []}
            ]
        });
    }
}

//----------------------------------
function poll() {
    var clientDevices;

    clientDeviceDetails = new actionheroClient({
        url: "https:api.staging.conctr.com"
    });

    var params = {
        authorization: "jwt:" + localStorage.getItem("jwt"),
        access_level: "consumer",
        _device_id: DEVICE_ID,
        app_id: CONCTR_APP_ID,
        limit: 1000,
        orderBy: [{field: "_ts"}]
    };

    clientDeviceDetails.connect(function(err, details) {
        clientDeviceDetails.action("device_search_historical_stream", params, function(resp) {

        });
    });

    clientDeviceDetails.on("message", function(message) {

        if (message.context == "error") {
            console.error(message);
            alertify.error(message.data);
        }

        if (message.context == "historical_data" && message.event == "update_data" && message.data && message.data.new_val && message.data.new_val._device_id == DEVICE_ID) {

            for (var metric in metrics) {
                if (metric in message.data.new_val) {
                    metrics[metric].buffer.push(message.data.new_val[metric]);
                }
            }

            for (metric in metrics) {
                if (metrics[metric].buffer.length >= MAX_BUFFER_SIZE) {
                    updateGraphs();
                    break;
                }
            }

            if ("event" in message.data.new_val) {
                var eventOption = document.createElement("option");
                var eventDropdown = document.getElementById('eventDropdown');
                eventOption.value = message.data.new_val.event + " | " + message.data.new_val._ts;
                eventOption.innerHTML = message.data.new_val.event + " | " + message.data.new_val._ts;
                eventDropdown.insertBefore(eventOption, eventDropdown.children[1]);
                if (eventDropdown.length >= 100) {
                    eventDropdown.removeChild(eventDropdown.childNodes[eventDropdown.length - 1]);
                }
            }

        }
    });
}

//----------------------------------
function updateGraphs() {
    for (var metric in metrics) {
        for (var i = 1; i <= MAX_BUFFER_SIZE; i++) {
            var shift = metrics[metric].chart.series[0].data.length > 1000;
            var redraw = false;
            if (i == MAX_BUFFER_SIZE) {
                redraw = true;
            }

            // Make sure we don't overrun the buffer
            if (metrics[metric].buffer.length == 0) {
                metrics[metric].chart.redraw();
                break;
            }

            metrics[metric].chart.series[0].addPoint(metrics[metric].buffer[0], redraw, shift);
            metrics[metric].buffer.shift();

        }
    }
}

//----------------------------------
function startEvent() {
    if (inEvent) {
        return;
    } else {
        inEvent = true;
        document.getElementById("endEvent").classList.remove("disabled");
        document.getElementById("startEvent").classList.add("disabled");
    }
}

//----------------------------------
function endEvent() {
    if (!inEvent) {
        return;
    } else {
        inEvent = false;
        document.getElementById("endEvent").classList.add("disabled");
        document.getElementById("startEvent").classList.remove("disabled");
    }
}

//-----------------------
// Navigate to the factories page
$("#eventsBtn").click(function(event) {
	window.location.hash = "eventsView";
});

    /*

    function parseOne(string) {
        return string.split(',').map(Number);
    }

    var config = null;
    var hasPlotBand = false;

    function getConfig() {
        config =  {
            "realAccelThreshold": Number($('#real-accel-threshold').val()),
            "windowSize": Number($('#window-size').val()),
            "decay": Number($('#decay').val()),
            "zShift": Number($('#z-shift').val()),
            "history": Number($('#history').val())
        }

        for (var axis of axes) {
            if (hasPlotBand) {
                average[axis].yAxis[0].removePlotBand('real-accel-threshold');
                velocity[axis].xAxis[0].removePlotBand('history');
            }

            average[axis].yAxis[0].addPlotBand({
                from: -config.realAccelThreshold,
                to: config.realAccelThreshold,
                color: '#FCFFC5',
                id: 'real-accel-threshold'
            });

            var lastX = velocity[axis].series[0].xData[velocity[axis].series[0].xData.length - 1];
            velocity[axis].xAxis[0].addPlotBand({
                from: lastX - config.history,
                to: lastX,
                color: '#FCFFC5',
                id: 'history'
            });

            hasPlotBand = true;
        }
    }

    getConfig();
    $('button.config').click(getConfig);

    var countdown = -1;
    var watching = true;

    function onValue(data) {
        for (var axis of ["z", "y", "x"]) {
            parseOne(data.val()[axis]).forEach(function(val) {
                val = (axis === "z") ? val + config.zShift : val;
                normal[axis].series[0].addPoint(val, false, true);

                var raw = normal[axis].series[0].yData;
                var nextAverage= averageOf(raw.slice(raw.length-config.windowSize));
                average[axis].series[0].addPoint(nextAverage, false, true);

                var history = velocity[axis].series[0].yData;
                var last = history[history.length - 1];
                if (Math.abs(nextAverage) > config.realAccelThreshold) {
                    var nextVelocity = last + nextAverage;
                    var nextVelocity = (nextVelocity > 0)
                        ? Math.min(nextVelocity,  1000)
                        : Math.max(nextVelocity, -1000);
                } else {
                    nextVelocity = last * config.decay;
                }
                velocity[axis].series[0].addPoint(nextVelocity, false, true);

                if (!watching) return;

                var recentHistory = history.slice(history.length - config.history);
                var stats = getStats(recentHistory);

                if (
                    (stats.directionChanges === 1)
                    && (stats.max > 100 || stats.min < -100)
                    && (stats.max < 800)
                    && (stats.min > -800)
                    //&& (stats.axisCrossings < 3)
                    //&& (stats.axisCrossings === 0)
                    //&& ((stats.max - stats.min) > 100)
                    //&& (stats.max - stats.start > 50)
                    //&& (stats.max - stats.end > 50)
                ) {
                    watching = false;
                    setTimeout(()=>watching = true, 4000);

                    var direction = (stats.max > 100) ? "+" : "-";

                    console.log( direction + axis);
                }
            })
        }
        for (var axis of axes) {
            normal[axis].redraw();
            average[axis].redraw();
            velocity[axis].redraw();
        }
    }

    firebase.on("value", onValue);

    var playing = true;

    function togglePlay() {
        var button = $('button#play');
        if (playing) {
            playing = false;
            button.text("Play");
            firebase.off("value", onValue);
        } else {
            playing = true;
            button.text("Pause");
            firebase.on("value", onValue);
        }
    }

    $('button#play').click(togglePlay);

    function averageOf(array) {
        var average = array.reduce(function(prev, next) {
            return prev + next;
        }) / array.length;
        return isNaN(average) ? 0 : average;
    }

    function getStats(array) {
        stats = {
            directionChanges: 0,
            max: -Infinity,
            min: Infinity,
            axisCrossings: 0,
            start: array[0],
            end: array[array.length - 1]
        };

        var prev = [0, 0];

        array.forEach(function(val) {
            stats.max = (stats.max > val) ? stats.max : val;
            stats.min = (stats.min < val) ? stats.min : val;

            if (prev[1] * val < 0)
                stats.axisCrossings++;

            if((prev[1] - prev[0]) * (val - prev[1]) < 0)
                stats.directionChanges++;

            prev.shift();
            prev.push(val)
        });

        return stats;
    }

    function getURLParameter(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++)
        {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam)
            {
                return sParameterName[1];
            }
        }
    }
    */
