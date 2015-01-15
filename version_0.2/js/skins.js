BayColorScheme = {
   basic: {
      cell: {
         fillColor: '',
         borderColor: 'black',
         borderWidth: 1,
         fontColor: 'black',
         fontSize: 8,
         fontFamily: 'Verdana',
         fontStyle: 'normal',
      },
      cellTypes:{
         clue: {
            fontColor: 'black',
         },
         mine: {
            fillColor: 'LightGreen',
         },
         others: {
            fillColor: 'LightPink',
         }
      },
      frame: {
         fillColor: '',
         borderColor: 'black',
         borderWidth: 2,
      },
      active: {
         fillColor: '',
         borderColor: 'red',
         borderWidth: 4,
         borderMargin: 5,
      },
      pallet: {
         fillColor: 'lightblue',
         opacity: 0.4,
         borderColor: 'darkblue',
         borderWidth: 2,
         fontColor: 'darkblue',
         fontSize: 6,
         fontFamily: 'sans-serif',
         fontStyle: 'bold',
      }
   },
   grey: {
      cell: {
         borderColor: 'silver',
      },
      frame: {
         borderColor: 'silver',
         borderWidth: 3,
      },
      active: {
         borderColor: 'pink',
         borderMargin: 6,
      }
   },
   sky: {
      cell: {
         fillColor: '#BDF',
         borderColor: 'white',
         borderWidth: 2,
      },
      frame: {
         borderColor: 'white',
         borderWidth: 4,
      },
      active: {
         borderColor: 'black',
         borderMargin: 6,
      }
   },
   wooden: {
      cell: {
         fillColor: '#DB9',
         borderColor: '#855',
         borderWidth: 2,
      },
      frame: {
         borderColor: '#855',
         borderWidth: 4,
      },
      active: {
         borderColor: 'yellow',
         borderMargin: 6,
      },
      pallet: {
         fillColor: 'red',
         opacity: 0.4,
         borderColor: 'red',
         fontColor: 'black'
      }
   },
}

for(scheme in BayColorScheme){
   BayColorScheme[scheme] = $.extend(true, {}, BayColorScheme['basic'], BayColorScheme[scheme]);
   for(type in BayColorScheme[scheme].cellTypes){
      BayColorScheme[scheme][type] = $.extend(true, {}, BayColorScheme[scheme].cell, BayColorScheme[scheme].cellTypes[type]);
   }
}

