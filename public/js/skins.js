var BayColorScheme = {
   basic: {
      cell: {
         fillColor: '',
         borderColor: '#3a386c',
         borderWidth: 1,
         fontColor: '#3a386c',
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
         borderColor: '#3a386c',
         borderWidth: 3,
      },
      doubleframe: {
         fillColor: '',
         borderColor: '#3a386c',
         borderWidth: 6,
      },
      active: {
         fillColor: '',
         borderColor: 'red',
         borderWidth: 4,
         borderMargin: 7,
      },
      pallet: {
         fillColor: 'lightblue',
         opacity: 0.4,
         borderColorLight: 'white',
         borderColorDark: 'darkblue',
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
      doubleframe: {
         borderColor: 'silver',
         borderWidth: 6,
      },
      active: {
         borderColor: 'pink',
         borderMargin: 8,
      }
   },
   sky: {
      cell: {
         fillColor: '#CCEEFF',
         borderColor: 'white',
         borderWidth: 2,
      },
      frame: {
         borderColor: 'white',
         borderWidth: 4,
      },
      doubleFrame: {
         borderColor: 'white',
         borderWidth: 4,
      },
      active: {
         borderColor: 'black',
         borderMargin: 8,
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
      doubleFrame: {
         borderColor: '#855',
         borderWidth: 8,
      },
      active: {
         borderColor: 'yellow',
         borderMargin: 8,
      },
      pallet: {
         fillColor: 'red',
         opacity: 0.4,
         borderColorDark: 'MediumVioletRed ',
         borderColorLight: 'Pink',
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

