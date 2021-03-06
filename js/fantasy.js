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
        url: `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/?page_new_entries=1&page_standings=${pageNo}&phase=1`,
        type: 'GET',
        crossDomain: true,
        dataType : "json",
//         headers: {
//             'Access-Control-Allow-Origin': '*'
//         },
        success: function (data) {
          data = JSON.parse(data);
          resolve(data);
      },
        error: function(err) {console.log(err)},
    });
  });
}


const findTotalPageOfLeague = (leagueId) => {
  let currentPage = 1;

  let lowerPoint = 0;
  let higherPoint = 512;
  let iterations = 0;
  while(true || iterations < 100) {
    iterations += 1;
    console.log(iterations);
    currentPage = parseInt((lowerPoint + higherPoint)/2, 10);
    let requestedURL = `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/?page_new_entries=1&page_standings=${currentPage}&phase=1`;
//                         https://fantasy.premierleague.com/api/leagues-classic/122225/standings/?page_new_entries=1&page_standings=1&phase=1
    if ((higherPoint - lowerPoint) < 2 || iterations > 50) {
      break;
    }
    $.ajax({
      url: requestedURL,
      type: "GET",
      async :true,
      dataType : "json",
//       headers: { 
//         'Content-Type': 'application/json',
//         'Access-Control-Allow-Origin': '*'
//       },
      crossDomain: true,
      success: function(data, textStatus, jqXHR) {
        data = JSON.parse(data);
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
  url: 'https://fantasy.premierleague.com/api/entry/992654/',
  type: "GET",
  crossDomain: true,
  dataType : "json",
//   headers: {
//       'Access-Control-Allow-Origin': '*'
//   },
  success: function(data, textStatus, jqXHR) {
    data = JSON.parse(data);
    $("#gameWeekInput").val(data.current_event);
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
      let requestedURL = 'https://fantasy.premierleague.com/api/leagues-classic/' + leagueId + '/standings/?phase=1&page_standings=' + currentPage;

      requests.push(getLeagueDataFromFplByLeagueIdAndPageNo(leagueId, currentPage));
      currentPage++;
    }
    
    Promise.all(requests)
      .then((datas) => {
        const allPlayerDataApis = datas.reduce((accumulator, data) => {
          const playerDataApis = data.standings.results.map((playerData) => {
            return 'https://fantasy.premierleague.com/api/entry/' + playerData.entry;
          });
          return accumulator.concat(currentIterationRowDatas);
        }, []);
        console.log(allPlayerDataApis);
      });

//     Promise.all(requests)
//       .then((datas) => {
//         const rowDatas = datas.reduce((accumulator, data) => {
//           const currentIterationRowDatas = data.standings.results.map((playerData) => {
//             const managerProfileLink = 'https://fantasy.premierleague.com/entry/' + playerData.entry + '/event/' + gw;
//             const tableRow = [
//               '',
//               playerData.player_name,
//               playerData.entry_name,
//               playerData.event_total,
//               playerData.total,
//               playerData.last_deadline_total_transfers,
//               playerData.rank,
//               '<a href="'+managerProfileLink+'">'+ managerProfileLink +'</a>',
//             ];
//             return tableRow;
//           });
//           return accumulator.concat(currentIterationRowDatas);
//         }, []);
//         console.log(rowDatas);
//         datatable.rows.add(rowDatas).draw( false );
//         datatable.column(0, {search:'applied', order:'applied'}).nodes().each( function (cell, i) {
//             cell.innerHTML = i+1;
//         } );
//         datatable.draw();
//         $('#ajaxLoaderDiv').hide();
//       });
  });

});  
  
