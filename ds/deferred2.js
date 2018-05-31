var g_apiKey = "";
var g_mySectet = "";
var g_sessionKey = "";

jQuery(document).ready(function () {
    // activate tablesorter plugin
    $('#main-table').tablesorter();
});

var g_ResultJSON = [];
var g_ResultTrackCount = 0;

function trackAddedToResult() {
    g_ResultTrackCount++;
    document.getElementById('deferred-scrobble-count').innerText = g_ResultTrackCount;
}

function clearPreparedData() {
    g_ResultJSON = [];
    g_ResultTrackCount = 0;
    document.getElementById('deferred-scrobble-count').innerText = '0';
}

function exportAsText() {
    //var textAreaValue = document.getElementById('deferred-scrobble-result').value;
    //var blob = new Blob([textAreaValue], { type: "text/plain;charset=utf-8" });
    //saveAs(blob, 'deferred-scrobble-result.json');

    var blob = new Blob([JSON.stringify(g_ResultJSON, null, 4)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, 'deferred-scrobble-result.json');
}

function LoadDataAsJSON() {
    var thisObject = this;
    var inputNode = event.target;
    var reader = new FileReader();
    reader.onload = function () {
        var g_Json_Data = JSON.parse(reader.result);

        for (var i in g_Json_Data) {
            var trElem = "<tr>";
            //trElem += "<td></td>\n"); // cover art

            trElem += ("<td><h2>" + g_Json_Data[i].id + "</h2>\n");
            trElem += ("</td>\n");

            trElem += ("<td>\n");
            trElem += ("<a id='add-album-" + i + "' href='#' onclick='addAlbum(\"" + i + "\"); return false;''>add to scrobble list</a>\n");
            trElem += ("<br />\n");
            trElem += ("<br />\n");
            trElem += ("<a id='showhide-tracklist-" + i + "' href='#' onclick='showTracklist(\"" + i + "\"); return false;'><img class='icon' src='ext/plus.gif' id='icon-tracklist-" + i + "' /></a><span>&nbsp;show/hide tracklist</span>\n");
            var newElem = ("<table>");
            var AllTracksLength = 0;
            var FIIO_ONE_ALBUM = g_Json_Data[i].tracks;
            for (var j in FIIO_ONE_ALBUM) {
                newElem += ("<tr><td>" + FIIO_ONE_ALBUM[j]['Title'] + "</td>");

                var trackDurationArray = FIIO_ONE_ALBUM[j]['Duration'].split(':');
                var trackDuration = ((parseInt(trackDurationArray[0], 10) * 60) + parseInt(trackDurationArray[1], 10)) * 1000;
                AllTracksLength += trackDuration;

                var RootFolder = escapeChars(g_Json_Data[i].id.replace(/\\/g, "/"));

                newElem += ("<td><a class='singletrack' href='#' id='scrobble-track-" + i + "-" + j + "' " +
                    "data-number=\"" + parseInt(FIIO_ONE_ALBUM[j]['TN'], 10) + "\" " +
                    "data-duration=\"" + trackDuration + "\" " +
                    "data-scrobbletime=\"\" " +
                    "data-artist=\"" + escapeChars(FIIO_ONE_ALBUM[j]['Artist']) + "\" " +
                    "data-albumartist=\"" + escapeChars(FIIO_ONE_ALBUM[j]['AlbumArtist']) + "\" " +
                    "data-album=\"" + escapeChars(FIIO_ONE_ALBUM[j]['Album']) + "\" " +
                    "data-title=\"" + escapeChars(FIIO_ONE_ALBUM[j]['Title']) + "\" " +
                    "data-rootfolder=\"" + RootFolder + "\" " +
                    "onclick='scrobbleTrack(\
\"" + RootFolder  + "\",\
\"" + escapeChars(FIIO_ONE_ALBUM[j]['Artist']) + "\",\
\"" + escapeChars(FIIO_ONE_ALBUM[j]['AlbumArtist']) + "\",\
\"" + escapeChars(FIIO_ONE_ALBUM[j]['Album']) + "\",\
\"" + escapeChars(FIIO_ONE_ALBUM[j]['Title']) + "\",\
this.dataset.number,\
this.dataset.duration,\
\"" + i + "-" + j + "\",\
this.dataset.scrobbletime); " +
"return false;'>scrobble</a></td>");

                newElem += ("<td><img class='throbber' src='ext/throbber.gif' id='throbber-" + i + "-" + j + "' style='display: none;' />");
                newElem += ("<span class='progress' id='progress-" + i + "-" + j + "'></span></td>");

                newElem += ("</tr>\n");
            } // for (var j in FIIO_ONE_ALBUM)
            newElem += ("</table>\n");

            trElem += ("&nbsp;&nbsp;&nbsp;<a id='scrobble-album-" + i + "' href='#' onclick='scrobbleAlbum(\"" + i + "\"); return false;'' style='display: none;'>scrobble album</a>\n");
            trElem += ("<img class='throbber' src='ext/throbber.gif' id='throbber-" + i + "' style='display: none;' />");
            trElem += ("<span class='progress' id='progress-" + i + "'></span>");
            trElem += ("<div id='tracklist-" + i + "' style='display: none;' data-duration=\"" + AllTracksLength + "\">\n");
            trElem += (newElem);
            trElem += ("</div>\n");
            trElem += ("</div></td>\n");

            if (0 == i) {
                trElem += ("<td rowspan=\"" + g_Json_Data.length + "\">");
                trElem += ("<div id='scrobbleListResult-'></div>");
                trElem += ("</td>");
            }
            trElem += ("</tr>\n");
            $("#main-table-body").append(trElem);
        } // for (var i in g_Json_Data)
    }; //  reader.onload = function

    reader.readAsText(inputNode.files[0], 'utf-8');
}

function scrobbleTrack_ON_LASTFM(unusedId, artist, releaseArtist, releaseTitle, trackTitle, trackNumber, duration, statusId, scrobbleTime, onCompleteFunc, doNotShowProgress) {
    var utcTime = new Date().getTime();
    utcTime -= duration;

    if (scrobbleTime) {
        utcTime = scrobbleTime;
    }
    utcTime = Math.round(utcTime / 1000);

    var fixtimeElemHour = document.getElementById('fixtimeHour');
    var fixtimeElemMin = document.getElementById('fixtimeMin');
    var fixtimeValue = fixtimeElemHour ? (fixtimeElemHour.value * 3600) : 0;
    fixtimeValue += (fixtimeElemMin ? (fixtimeElemMin.value * 60) : 0);
    if (fixtimeValue)
        utcTime -= fixtimeValue;

    var params = "";
    params += "method=track.scrobble&sk=" + g_sessionKey + "&api_key=" + g_apiKey;
    params += "&artist=" + encodeURIComponent(artist);
    if (releaseArtist) {
        params += "&albumArtist=" + encodeURIComponent(releaseArtist);
    }
    params += "&track=" + encodeURIComponent(trackTitle);
    params += "&timestamp=" + utcTime;
    params += "&album=" + encodeURIComponent(releaseTitle);
    params += "&trackNumber=" + trackNumber;
    params += "&duration=" + duration;

    var apiSigTxt = "album" + releaseTitle;
    if (releaseArtist) {
        apiSigTxt += "albumArtist" + releaseArtist;
    }
    apiSigTxt +=
        "api_key" + g_apiKey +
        "artist" + artist +
        "duration" + duration +
        "methodtrack.scrobble" +
        "sk" + g_sessionKey +
        "timestamp" + utcTime +
        "track" + trackTitle +
        "trackNumber" + trackNumber +
        g_mySectet;
    apiSigTxt = utf8_encode(apiSigTxt);
    var apiSig = md5(apiSigTxt);

    params += "&api_sig=" + apiSig + "&format=json";

    if (!doNotShowProgress) {
        showHideThrobber(statusId, true);
        showProgress(statusId, "Scrobbling...");
    }

    jQuery.post("http://ws.audioscrobbler.com/2.0/?" + params, "",
		function (data) {
		    if (data.scrobbles && data.scrobbles['@attr'].accepted) {
		        if (!doNotShowProgress) {
		            showProgress(statusId, "Success!");
		        } else {
		            console.log('success!');

		        }
		    }
		    else {
		        if (!doNotShowProgress) {
		            showProgress(statusId, "Scrobbling failed with message '" + data.message + "'");
		        } else {
		            console.log("Scrobbling failed with message '" + data.message + "'");
		        }
		    }

		    if (!doNotShowProgress)
		        showHideThrobber(statusId, false);

		    // Call the passed callback function, if provided
		    if (onCompleteFunc) {
		        onCompleteFunc();
		    }
		});

    return true;
}

// not really scrobble track on lastfm service, just mark it and save scrobble time for future using
function scrobbleTrack(rootFolder, artist, releaseArtist, releaseTitle, trackTitle, trackNumber, duration, statusId, scrobbleTime, onCompleteFunc, doNotShowProgress) {
    var utcTime = new Date().getTime();
    utcTime -= duration;

    if (scrobbleTime) {
        utcTime = scrobbleTime;
    }
    utcTime = Math.round(utcTime / 1000);

    var fixtimeElemHour = document.getElementById('fixtimeHour');
    var fixtimeElemMin = document.getElementById('fixtimeMin');
    var fixtimeValue = fixtimeElemHour ? (fixtimeElemHour.value * 3600) : 0;
    fixtimeValue += (fixtimeElemMin ? (fixtimeElemMin.value * 60) : 0);
    if (fixtimeValue)
        utcTime -= fixtimeValue;

    //var textArea = document.getElementById('deferred-scrobble-result');
    //textArea.value += "\n";

    // AIMP time to UTC (2 is day fix, 10800 is 3 hours fix)
    // (((x - 25567 - 2) * 86400) - 10800) * 1000
    var aimpTime = (((utcTime) + 10800) / 86400) + 25567 + 2;

    rootFolder = rootFolder.replace(/\//g, "\\");
    var albumObject = null;
    for (var a in g_ResultJSON) {
        if (rootFolder === g_ResultJSON[a].id) {
            albumObject = g_ResultJSON[a];
            break;
        }
    }
    if( !albumObject ) {
        g_ResultJSON.push({ id: rootFolder, tracks: [] });
        albumObject = g_ResultJSON[g_ResultJSON.length - 1];
    }
    albumObject.tracks.push({
        tn: ("NaN" == trackNumber) ? '' : trackNumber,
        artist: artist,
        albumArtist: releaseArtist,
        album: releaseTitle,
        title: trackTitle,
        duration_ms: duration,
        scrobble_time: utcTime,
        scrobble_time_aimp: aimpTime
    });
    trackAddedToResult();

    $("#aimpTimes").append("<tr><td>" + rootFolder + "</td><td>" + aimpTime + "</td></tr>");
}

function scrobbleAlbum(tracklistId) {
    var tracklistElem = document.getElementById("tracklist-" + tracklistId);
    var FullAlbumLength = parseInt(tracklistElem.dataset.duration);

    showHideThrobber(tracklistId, true);
    showProgress(tracklistId, "Scrobbling...");

    var utcTime = new Date().getTime();
    utcTime -= FullAlbumLength;

    // search child nodes and manually call OnClick
    var singleTrack;
    var j = 0;
    while ((singleTrack = document.getElementById("scrobble-track-" + tracklistId + "-" + j))) {
        if (typeof singleTrack.onclick == "function") {
            // set scrobble time
            singleTrack.dataset.scrobbletime = utcTime;
            // scrobbleTrack()
            singleTrack.onclick.apply(singleTrack);
            // fix time for next track
            utcTime += parseInt(singleTrack.dataset.duration);
            // reset value in element
            singleTrack.dataset.scrobbletime = "";
        }
        j++;
    }

    showProgress(tracklistId, "");
    showHideThrobber(tracklistId, false);
}

function addAlbum(tracklistId) {
    var tracklistElem = document.getElementById("tracklist-" + tracklistId);
    var FullAlbumLength = parseInt(tracklistElem.dataset.duration);

    if ("" == document.getElementById("scrobbleListResult-").innerHTML) {
        var tableHeader = "<div id='tracklist-list'>";
        tableHeader += "<div style='display: flex;'>";
        tableHeader += "<input type='button' value='<<<' onclick='removeTrack(\"\");' style='width: 40px;'>";
        tableHeader += "<input disabled type='text' value='Artist' size='22'>";
        tableHeader += "<input disabled type='text' value='Album Artist' size='22'>";
        tableHeader += "<input disabled type='text' value='Album' size='22'>";
        tableHeader += "<input disabled type='text' value='Title' size='22'>";
        tableHeader += "<input disabled type='text' value='TN' size='1'>";
        tableHeader += "<a id='scrobble-album-list' href='#' onclick='scrobbleAlbum(\"list\"); return false;' style='display: none;'>scrobble all</a>";
        tableHeader += "<img class='throbber' src='ext/throbber.gif' id='throbber-list' style='display: none;' />";
        tableHeader += "<span class='progress' id='progress-list'></span>";
        tableHeader += "</div>";
        tableHeader += "</div>";
        $("#scrobbleListResult-").append(tableHeader);
        document.getElementById('tracklist-list').dataset.duration = 0;
        document.getElementById('tracklist-list').dataset.trackno = 0;

        // time fixer
        var fixTimeElem = "<div>\n\
<p>Fix scrobble time (in hours/minutes):\n\
<input type='text' id='fixtimeHour' value='' size='5' /> h. <input type='text' id='fixtimeMin' value='' size='5' /> m. \n\
</p></div>";
        $("#scrobbleListResult-").append(fixTimeElem);

        // AIMP times
        $("#scrobbleListResult-").append("<table id='aimpTimes'></table>");
    }

    var globalTrackNo = parseInt(document.getElementById('tracklist-list').dataset.trackno);
    var AllTracksLength = parseInt(document.getElementById('tracklist-list').dataset.duration);
    var singleTrack;
    var j = 0;
    while ((singleTrack = document.getElementById("scrobble-track-" + tracklistId + "-" + j))) {
        var newElem = "<div id='scrobbleListResult-" + tracklistId + "-" + j + "'>";
        newElem += "<input type='button' value='<<' onclick='removeTrack(\"" + tracklistId + "-" + j + "\");' style='width: 40px;'>"
        newElem += "<input type='text' id='input-Artst-" + tracklistId + "-" + j + "' value='" + escapeChars(singleTrack.dataset.artist) + "' size='22'>";
        newElem += "<input type='text' id='input-RelAr-" + tracklistId + "-" + j + "' value='" + escapeChars(singleTrack.dataset.albumartist) + "' size='22'>";
        newElem += "<input type='text' id='input-Album-" + tracklistId + "-" + j + "' value='" + escapeChars(singleTrack.dataset.album) + "' size='22'>";
        newElem += "<input type='text' id='input-Title-" + tracklistId + "-" + j + "' value='" + escapeChars(singleTrack.dataset.title) + "' size='22'>";
        newElem += "<input type='text' disabled value='" + singleTrack.dataset.number + "' size='1'>";
        newElem += "<a class='singletrack' href='#' id='scrobble-track-list-" + globalTrackNo + "' " +
            "data-number=\"" + singleTrack.dataset.number + "\" " +
            "data-duration=\"" + singleTrack.dataset.duration + "\" " +
            "data-scrobbletime=\"\" " +
            "onclick='scrobbleTrack(\"" +
                        escapeChars(singleTrack.dataset.rootfolder) + "\",\
                        document.getElementById(\"input-Artst-" + tracklistId + "-" + j + "\").value,\
                        document.getElementById(\"input-RelAr-" + tracklistId + "-" + j + "\").value,\
                        document.getElementById(\"input-Album-" + tracklistId + "-" + j + "\").value,\
                        document.getElementById(\"input-Title-" + tracklistId + "-" + j + "\").value,\
                        this.dataset.number,\
                        this.dataset.duration,\
                        \"list-" + globalTrackNo + "\",\
                        this.dataset.scrobbletime); " +
            "return false;'>scrobble</a>";
        newElem += "<img class='throbber' src='ext/throbber.gif' id='throbber-list-" + globalTrackNo + "' style='display: none;' />";
        newElem += "<span class='progress' id='progress-list-" + globalTrackNo + "'></span>";
        newElem += "</div>";
        $("#tracklist-list").append(newElem);

        AllTracksLength += parseInt(singleTrack.dataset.duration);
        globalTrackNo++;

        j++;
    }

    document.getElementById('tracklist-list').dataset.duration = AllTracksLength;
    document.getElementById('tracklist-list').dataset.trackno = globalTrackNo;
    document.getElementById('scrobble-album-list').style.display = "";
}

function removeTrack(trackId) {
    var trck = document.getElementById("scrobbleListResult-" + trackId);
    if (trck) {
        if ("" == trackId) {
            // kill whole list
            trck.innerHTML = "";
        }
        else if (tracklistElem = document.getElementById("tracklist-list")) {
            // hide track and remove "scrobble" function
            trck.style.display = 'none';
            var scrbblr = trck.getElementsByTagName('a')[0];
            scrbblr.onclick = "";
            // fix full duration
            tracklistElem.dataset.duration = parseInt(tracklistElem.dataset.duration) - parseInt(scrbblr.dataset.duration)
        }
    }
}

function showTracklist(tracklistId) {
    tl_div = document.getElementById("tracklist-" + tracklistId);
    tl_a = document.getElementById("showhide-tracklist-" + tracklistId);
    icon = document.getElementById("icon-tracklist-" + tracklistId);
    scrobbleAlbumHref = document.getElementById("scrobble-album-" + tracklistId);

    if (tl_div.style.display != 'none') {
        tl_div.style.display = 'none';
        //tl_a.innerText = 'show tracklist';
        icon.src = 'ext/plus.gif';
    }
    else {
        tl_div.style.display = 'block';
        //tl_a.innerText = 'hide tracklist';
        icon.src = 'ext/minus.gif';

        if (scrobbleAlbumHref && 'none' == scrobbleAlbumHref.style.display)
            scrobbleAlbumHref.style.display = '';
    }
}

function showHideThrobber(id, show) {
    throbber = document.getElementById("throbber-" + id);
    if (throbber) {
        if (show) {
            throbber.style.display = 'inline';
        }
        else {
            throbber.style.display = 'none';
        }
    }
}

function showProgress(id, text) {
    progressSpan = document.getElementById("progress-" + id);
    if (progressSpan) {
        progressSpan.innerHTML = text;
    }
}

function escapeChars(str) {
    output = unescape(str);
    output = output.replace(/'/g, "&#39;");
    output = output.replace(/"/g, "&quot;");
    return output;
}

