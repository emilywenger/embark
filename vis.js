/*
title: EMbArK
author: Emily Willson
date: 8 Feb 2018
purpose: this will visualize the evolution of EMbArK, the evolutionary Machi Koro
         algorithm. 
*/

/*
 
TODO: Figure out playback process. 
TODO: Implement the second vis -- showing card importance at each stage. 
TODO: implement page design. 
*/

////////////////////////////// SET VIS PARAMS //////////////////////////////

// Set up SVG with specified height and width -- this will hold all card sets.

var svg = d3.select("svg"),
    mainWidth = +svg.attr("width"),
    mainHeight =+svg.attr("height");

params = {'mainHeight': mainHeight,
          'mainWidth': mainWidth,
          'groupPadding': 5,
          'rectPadding':2};

////////////////////////////// CREATE DATA //////////////////////////////

// Function to generate data colors. 
card_colors = {'wheat_field':'#3773d3',
               'ranch':'#3773d3',
               'bakery':'#35723c',
               'cafe':'#c61919',
               'conv_store':'#35723c',
               'forest':'#3773d3',
               'tv_station':'#9230a3',
               'biz_center':'#9230a3',
               'stadium':'#9230a3',
               'cheese_fact':'#35723c',
               'furn_fact':'#35723c',
               'mine':'#3773d3',
               'family_rest':'#c61919',
               'apple_orch':'#3773d3',
               'fruit_veg_mkt':'#35723c',
               'train_station':'#e2863f',
               'amuse_park':'#e2863f',
               'shop_mall':'#e2863f',
               'radio_tower':'#e2863f',
               'win_count':'black'};

names = ['wheat_field', 'ranch', 'bakery', 'cafe', 'conv_store', 'forest','tv_station', 'biz_center', 'stadium', 'cheese_fact', 'furn_fact', 'mine', 'family_rest', 'apple_orch', 'fruit_veg_mkt', 'train_station', 'amuse_park', 'shop_mall', 'radio_tower', 'win_count'];

// Function to generate fake data. 
generateData = function(n_vectors) {
    names = ['wheat_field', 'ranch', 'bakery', 'cafe', 'conv_store', 'forest','tv_station', 'biz_center', 'stadium', 'cheese_fact', 'furn_fact', 'mine', 'family_rest', 'apple_orch', 'fruit_veg_mkt', 'train_station', 'amuse_park', 'shop_mall', 'radio_tower', 'win_count'];
    data = []
    for(var i = 0; i < n_vectors; i++) {
        tmp = []
        tot_val = 0
        // Assign random probabiliy to each name.
        for(var j = 0; j < names.length; j++) {
            tmp.push(Math.random())
            tot_val += tmp[j]
        }
        _.each(tmp, function(value) { value /= tot_val }); 
        data.push(tmp);
    }
    return data;
}

////////////////////////////// HELPER FUNCTIONS //////////////////////////////

setDim = function(data_length, params, dim='Height') {
    // NOTE: assume a 5 column, 4 row layout.
    if ((dim != 'Height') && (dim != 'Width')) {
        console.log('Please specify Height or Width as the dim parameter')
        return 0, 0;
    }
    else {
        // Determine if we're looking at rows or columns.
        var dim_num = (dim == 'Height') ? 4 : 5;
        // Figure out how big the specified dim is for this group.
        rect_group_dim = Math.floor((params['main' + dim] - 2*params['groupPadding'] - dim_num*params['rectPadding'])/dim_num) - dim_num*params['groupPadding'];
        // Figure out how big the specified dim is for individual rects.
        ind_rect_dim = Math.floor((rect_group_dim - 2*params['groupPadding']
                                   - dim_num*params['rectPadding'])/dim_num);
        
        return [rect_group_dim, ind_rect_dim];
    }
}

setLoc = function(data_length, data_set_index, item_index, params, dim='y') {
    // NOTE: 5 columns and 4 rows.
    if ((dim != 'y') && (dim != 'x')) {
        console.log('Please specify x or y as the dim parameter')
        return 0, 0;
    }
    // Get dimensions for this rectangle group and individual rect. 
    var dims = (dim == 'y') ? setDim(data_length, params, 'Height') :
        setDim(data_length, params, 'Width');
    var  dim_num = (dim == 'y') ? 4 : 5;
    // Find the location of upper left corner of this group.
    var rect_group_loc = (dim=='y') ? (data_set_index%Math.sqrt(data_length))*dims[0] :
        Math.ceil((data_set_index+1)/Math.sqrt(data_length))*dims[0]-dims[0];
    // Now figure out the individual placement of this particular rect within the group.
    ind_rect_loc = (item_index%dim_num)*dims[1];
    return rect_group_loc + ind_rect_loc;
}

////////////////////////////// MAKE THE VIS //////////////////////////////

makeSquaresVis = function(howMuchData) {
    // Maybe insert error checking to make sure you make a perfect square?
    
    var data = generateData(howMuchData);
    
    var squares = svg.append('g').attr('class', 'squares')
        .attr('height', mainHeight)
        .attr('width', mainWidth);
    

    for (var ix = 0; ix < data.length; ix++ ){
        squares.append('g').attr('class', 'rect_group_'+ix)
            .selectAll('g')
            .data(data[ix]).enter().append('g');
        
        d3.select('.rect_group_'+ix).selectAll('g').append('rect')
            .attr('height', setDim(data.length, params, dim='Height')[1])
            .attr('width', setDim(data.length, params, dim='Width')[1])
            .attr('x', function(d,i) {
                return setLoc(data.length, ix, i, params, 'x');
            })
            .attr('y', function(d,i) {
                return setLoc(data.length, ix, i, params, 'y');
            })
            .attr('opacity', function(d) {
                return d;
            })
            .attr('fill', function(d,i) {
                return card_colors[names[i]];
            });
    }
}


makeLineGraph = function(howMuchData) {
    // input data here is a list containing the winning strategy from each
    // round. the goal is to visualize how much different cards mattered
    // over time in shaping the winnning strategy.
    
    data = generateData(howMuchData);

    // x axis = range from 0 to length of categories. There will be a separate entry for each category. 
    var xScale = d3.scaleOrdinal().domain(_.range(1,names.length)).range([0, 900]);
    // y axis = probability 
    var yScale = d3.scaleLinear().domain(d3.extent(data)).range(_.range(0, 400, names.length));

    // color = each strategy. Or, if you're looking at the evolution of one strategy over time, one round for a strategy. 

    // line
    var line = d3.line().x(function(d,i) { return xScale(i+1); })
        .y(function(d,i) { return yScale(i); });

    var lineGraph = svg.append('g').attr('class', 'line_graph')
        .attr('height', 200)
        .attr('width', 900)
        .attr('transform', 'translate(70,' + 600 + ')');
    
    var xAxis = lineGraph.append("g")
        .attr("transform", "translate(0," + xScale(0) + ")")
        .call(d3.axisBottom(xScale).ticks(names.length));

    xAxis.select(".domain").remove();
    
    xAxis.selectAll('g.tick').attr('transform', function(d,i) {
        console.log(d)
        return 'translate(0,' + xScale(d) + ')'; })
        .attr('x', function(d) { return xScale(d); });
    
    lineGraph.append("g")
        .call(d3.axisLeft(yScale))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Card Importance");
    
    // for (el in data) {
    //     lineGraph.append("path")
    //         .datum(data[el])
    //         .attr("fill", "none")
    //         .attr("stroke", "steelblue")
    //         .attr("stroke-linejoin", "round")
    //         .attr("stroke-linecap", "round")
    //         .attr("stroke-width", 1.5)
    //         .attr("d", line);
    // }
}

function test() {
    console.log('it works!');
}


////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// RUN THE THING!! ///////////////////////////////

makeSquaresVis(25);

//makeLineGraph(10);


