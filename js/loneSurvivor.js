$.ajaxPrefilter( function (options) {
  if (options.crossDomain && jQuery.support.cors) {
    var http = (window.location.protocol === 'http:' ? 'http:' : 'https:');
//     options.url = http + '//cors-anywhere.herokuapp.com/' + options.url;
      options.url = "https://www.10coders.com/ffpbBoR/apis/enableCORS?corsUrl=" + options.url;
    //options.url = "http://cors.corsproxy.io/url=" + options.url;
  }
});

const getLeagueDataFromFplByLeagueIdAndPageNo = (leagueId, pageNo) => {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: `https://fantasy.premierleague.com/api/leagues-classic-standings/${leagueId}?phase=1&le-page=1&ls-page=${pageNo}`,
        type: 'GET',
        crossDomain: true,
        success: function (data) {
          resolve(data);
      },
        error: function(err) {console.log(err)},
    });
  });
}

const getPlayerDataById = (playerId, gw, playerName) => {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: `https://fantasy.premierleague.com/api/entry/${playerId}`,
        type: 'GET',
        crossDomain: true,
        success: function (data) {
          resolve({[playerName]: data});
      },
        error: function(err) {console.log(err)},
    });
  });
}


const findTotalPageOfLeague = (leagueId) => {
  let currentPage = 1;

  let lowerPoint = 0;
  let higherPoint = 1024*4;
  while(true) {
    currentPage = parseInt((lowerPoint + higherPoint)/2, 10);
    let requestedURL = 'https://fantasy.premierleague.com/api/leagues-classic-standings/' + leagueId + '?phase=1&le-page=1&ls-page=' + currentPage;
    if ((higherPoint - lowerPoint) < 2) {
      break;
    }
    $.ajax({
      url: requestedURL,
      type: "GET",
      async :false,
      success: function(data, textStatus, jqXHR) {
        if (data.standings.has_next) {
          lowerPoint = currentPage;
          currentPage = parseInt((lowerPoint + higherPoint)/2, 10);
        } else {
          higherPoint = currentPage;
          currentPage = parseInt((lowerPoint + higherPoint)/2, 10);
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {

      }
    });
  }
  return higherPoint;
}
$.ajax({
  url: 'https://fantasy.premierleague.com/api/entry/992654',
  type: "GET",
  success: function(data, textStatus, jqXHR) {
    $("#gameWeekInput").val(data.entry.current_event);
  },
  error: function(jqXHR, textStatus, errorThrown) {

  }
});

$(document).on("ready", function(){

  $(".convert2select2").select2({
    placeholder: "Select a League",
    allowClear: true
  });

  var datatable = $("#playerListTable").DataTable({
    dom: 'Bfrtip',
    buttons: [
        {
          extend: 'csv',
          text: 'Download'
        },
    ],
    "order": [[ 3, "desc" ], [ 4, "desc" ]]
  });

  $('#leagueSelect').on('change', function() {
    $('#leagueInput').val($('#leagueSelect').val());
  })

  $(".searchButton").on("click", function(){
    $('#ajaxLoaderDiv').show();
    datatable.clear().draw();;
    var leagueId = $(this).prevAll(".leagueIDInput").val();
    var gw = $("#gameWeekInput").val();
    if($.trim(gw) === '')
      gw = 1;

    const totalPage = findTotalPageOfLeague(leagueId);
    var currentPage = 1;
    var counter = 0;
    var leagueName = '';
    var tempData;
    const requests = [];
    while (currentPage <= totalPage) {
      var requestedURL = 'https://fantasy.premierleague.com/api/leagues-classic-standings/' + leagueId + '?phase=1&le-page=1&ls-page=' + currentPage;

      requests.push(getLeagueDataFromFplByLeagueIdAndPageNo(leagueId, currentPage));
      currentPage++;
    }

    Promise.all(requests)
      .then((datas) => {
        const playerReq = datas.reduce((accumulator, data) => {
          const currentIterationPlayerReq = data.standings.results.map((playerData) => {
            return getPlayerDataById(playerData.entry, gw, playerData.player_name);
          });
          return accumulator.concat(currentIterationPlayerReq);
        }, []);
        console.log(playerReq)
        return Promise.all(playerReq)
      })
      .then((datas) => {
        console.log(datas)
        const rowDatas = datas.reduce((accumulator, data) => {
          const playerName = Object.keys(data)
          console.log(playerName[0]);
          playerData = data[playerName[0]];
          const managerProfileLink = 'https://fantasy.premierleague.com/a/team/' + playerData.entry + '/event/' + gw;
          const tableRow = [
            '',
            playerName[0],
            playerData.summary_event_points,
            playerData.summary_overall_points,
            playerData.last_deadline_total_transfers,
            '<a href="'+managerProfileLink+'">'+ managerProfileLink +'</a>',
          ];
          accumulator.push(tableRow);
          return accumulator
        }, []);
        console.log(rowDatas);
        datatable.rows.add(rowDatas).draw( false );
        datatable.column(0, {search:'applied', order:'applied'}).nodes().each( function (cell, i) {
            cell.innerHTML = i+1;
        } );
        datatable.draw();
        $('#ajaxLoaderDiv').hide();
      })
  });

});  
  
