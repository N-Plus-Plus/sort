document.addEventListener(`DOMContentLoaded`, function () { onLoad(); } );
window.addEventListener("mousedown", function (e) { clicked( e, true ) } );

function onLoad(){
    loadState();
}

function clicked( e ){
    if( e.target.classList.contains(`doot`) ){
        if( game.sel == null ){ game.sel = parseInt( e.target.getAttribute(`data-x`) ); showSelection(); }
        else{
            if( !performMove( game.sel, parseInt( e.target.getAttribute( `data-x` ) ) ) ){ 
                game.sel = null;
                showSelection();
            }
            refreshUI();
        }
    }
    else{ game.sel = null; showSelection(); }
    if( e.target.getAttribute(`data-type`) == `reset` ){ resetLevel(); }
    if( e.target.getAttribute(`data-type`) == `surrender` ){ surrender(); }
    if( e.target.classList.contains(`begin`) ){ newRound(); }
}

function newRound(){
    let e = document.querySelector(`.modal`);
    setTimeout(() => { e.classList.add(`hidden`); }, 0 );
    setTimeout(() => { e.innerHTML = ``; }, 1250 );
    game.resets = 0;
    document.querySelector(`.reset`).innerHTML = `Reset [${g.resetLimit - game.resets}]`;
    game.sel = null;
    game.art = shuffle( [`a`,`b`,`c`,`d`,`e`,`f`,`g`,`h`,`i`,`j`,`k`,`l`,`m`,`n`,`o`] );
    newState();
    game.solution = [];
    while( game.solution.length == 0 ){ testSolve( 50 ); }
    setGoals();
    game.moves = 0;
    refreshUI();
    unhung();
}

function newState(){
    let d = g.diff;
    let a = [];
    for( let i = 0; i < g.doots; i++ ){
        a.push( [] );
        for( let j = 0; j < g.height; j++ ){ a[i].push( i ); }
    }
    for( let i = a.length; i < g.diff; i++ ){
        a.push( [] );
        for( let j = 0; j < g.height; j++ ){ a[i].push( null ); }
    }
    game.state = shuffle( a );
    jumble( Math.pow( d, 3 ) );
    game.start = JSON.parse( JSON.stringify( game.state ) );
}

function jumble( moves ){
    for( let n = 0; n < moves; n++ ){
        let m = JSON.parse( JSON.stringify( shuffle( legalMoves() )[0] ) );
        performMove( m[0], m[1], true );
    }
}

function validMoves(){
    let o = [];
    for( let a = 0; a < game.state.length; a++ ){
        for( let b = 0; b < game.state.length; b++ ){
            if( isValid( a, b ) ){ o.push( [ a, b ] ) }
        }
    }
    return o;
}

function isValid( from, to ){
    if( from == to ){ return false; }
    if( getDoot( from ) == null ){ return false }
    if( game.state[to].findIndex( e => e == null ) == -1 ){ return false } // desintation full
    if( getDoot( from ) !== getDoot( to ) && getDoot( to ) !== null ){ return false } // doot mismatch
    return true;
}

function legalMoves(){
    let o = [];
    for( let a = 0; a < game.state.length; a++ ){
        for( let b = 0; b < game.state.length; b++ ){
            if( isLegal( a, b ) ){ o.push( [ a, b ] ) }
        }
    }
    return o;
}

function isLegal( from, to ){
    if( from == to ){ return false; }
    if( getDoot( from ) == null ){ return false }
    if( game.state[to].findIndex( e => e == null ) == -1 ){ return false }
    return true;
}

function getDoot( x ){
    let firstNull = game.state[x].findIndex( e => e == null );
    if( firstNull == 0 ){ return null }
    if( firstNull == -1 ){ return game.state[x][g.height - 1] }
    return game.state[x][ game.state[x].findIndex( e => e == null ) - 1 ]
}

function performMove( from, to, bypass ){
    if( !bypass ){ if( !isValid( from, to ) ){ return false } }
    game.state[to].push( getDoot( from ) );
    for( i in game.state ){
        for( let j = game.state[i].length - 1; j >= 0; j-- ){
            if( game.state[i][j] == null ){ game.state[i].splice( j, 1 ) }
        }
        if( from == i ){ game.state[i].pop(); }
        for( let j = g.height - game.state[i].length; j > 0; j-- ){
            game.state[i].push( null );
        }
    }
    game.sel = null;
    if( !bypass ){
        checkWin();
        game.moves++;
    }
}

function moveLoop(){} // TODO - Figure out logic for single, and multiple loop states

function checkWin(){
    if( validMoves().length == 0 ){ hungState(); }
    for( i in game.state ){
        for( j in game.state[i] ){
            if( game.state[i][0] !== game.state[i][j] ){ return; }
        }
    }
    doWin();
}

function doWin(){
    setTimeout(() => {
        let msg = `You got there...`;
        let ico = `url('./z/wood.png");'`;
        if( game.moves <= game.goals[0] && game.resets < 1 ){ msg = `Outstanding!`; ico = `url('./z/diamond.png");'`; }
        else if( game.moves <= game.goals[1] && game.resets < 2 ){ msg = `Great!`; ico = `url('./z/gold.png");'`; }
        else if( game.moves <= game.goals[2] && game.resets < 3 ){ msg = `Okay!`; ico = `url('./z/stron.png");'`; }
        document.querySelector(`.modal`).innerHTML = `<div class="outcome">You win!</div><div class="outcomeIco" style="background-image: ${ico}"></div><div class="outcomeMessage">${msg}</div>`;
        document.querySelector(`.modal`).classList.remove(`hidden`);
        g.streak++;
        setTimeout(() => { newRound(); }, 1250 );
    }, 25 );
}

function hungState(){
    game.sel = null;
    showSelection();
    document.getElementById(`info`).innerHTML = `No valid moves left.`;
    document.querySelector(`[data-type="surrender"]`).classList.add(`appealing`);
    document.querySelector(`[data-type="reset"]`).classList.add(`appealing`);
    let g = document.querySelectorAll(`.goal`);
    for( let i = 0; i < g.length; i++ ){ g[i].classList.add(`lost`); }
}

function unhung(){
    document.getElementById(`info`).innerHTML = ``;
    document.querySelector(`[data-type="surrender"]`).classList.remove(`appealing`);
    document.querySelector(`[data-type="reset"]`).classList.remove(`appealing`);
}

function shuffle( arr ){
    for( let i = arr.length - 1; i > 0; i-- ){
        let j = Math.floor( Math.random() * ( i + 1 ) );
        [ arr[i], arr[j]] = [arr[j], arr[i]];
      };
      return arr;
}

function testSolve( times ){
    let m = 50;
    let solved = false;
    let hist = [];
    while( m >= 0 ){
        let thisHist = [];
        for( let n = times; n >= 0; n-- ){
            if( validMoves().length !== 0 ){
                let thisMove = JSON.parse( JSON.stringify( shuffle(validMoves())[0] ) );
                thisHist.push( thisMove[0] + ` to ` + thisMove[1] );
                performMove( thisMove[0], thisMove[1], true );
                let w = true;
                for( i in game.state ){
                    for( j in game.state[i] ){
                        if( game.state[i][0] !== game.state[i][j] ){ w = false; }
                    }
                }
                if( w ){
                    solved = true;
                    if( thisHist.length < times ){
                        times = thisHist.length;
                        hist = [];
                        for( h in thisHist ){ hist.push( thisHist[h] ) };
                    }
                }
            }
        }
        game.state = JSON.parse( JSON.stringify( game.start ) );
        m--;
    }
    if( !solved){ newState(); testSolve( 50 ); }
    else{ game.solution = parseSolution( hist ); console.log( game.solution.length ); }
}

function setGoals(){
    let n = game.solution.length;
    game.goals = [ n, n + 5, n + 10, n + 10 ]
}

function parseSolution( h ){
    for( let i = h.length - 2; i >= 0; i-- ){
        if( h[i].slice(0,1) == h[i+1].slice(-1) && h[i+1].slice(0,1) == h[i].slice(-1) ){ h.splice( i, 2 ); }
    }
    return h;
}

function refreshUI(){
    let elem = document.getElementById(`main`);
    elem.innerHTML = ``;
    for( i in game.state ){
        let s = document.createElement(`section`);
        s.setAttribute( `data-x`, i );
        let tube = document.createElement(`section`);
        tube.classList.add(`tube`);
        s.appendChild(tube);
        for( j in game.state[i] ){
            let d = document.createElement(`div`);
            d.style.backgroundImage = `url(./z/${game.art[game.state[i][j]]}.png)`;
            d.classList = `doot`;
            d.setAttribute( `data-x`, i );
            d.setAttribute( `data-y`, j );
            s.appendChild(d);
        }
        elem.appendChild(s);
    }
    showSelection();
    if( game.resets >= g.resetLimit ){ document.querySelector(`.reset`).classList.add(`disabled`); }
    else{ document.querySelector(`.reset`).classList.remove(`disabled`); }
    setTimeout(() => { refreshFoot(); }, 0 );
    document.getElementById(`score`).innerHTML = g.streak;
    setTimeout(() => { document.querySelector(`.modal`).classList.add(`hidden`); }, 0 );
}

function refreshFoot(){
    let elem = document.getElementById(`footer`);
    elem.innerHTML = `<div class="moves">${game.moves}</div>`
    for( let g = 0; g < goals.length; g++ ){
        let d = document.createElement(`div`);
        d.style.backgroundImage = `url(./z/${goals[g]}.png)`;
        d.classList.add( `goal` );
        if( game.moves > game.goals[g] || game.resets > g ){ d.classList.add(`lost`); }
        elem.appendChild(d);
    }
    let bar = document.createElement(`div`);
    bar.classList.add(`bar`);
    bar.style.right = elem.children[1].getBoundingClientRect().x + 16;
    let maxWidth = elem.children[4].getBoundingClientRect().x - elem.children[1].getBoundingClientRect().x;
    if( game.moves < game.goals[0] ){ bar.style.width = maxWidth; }
    else if( game.moves < game.goals[3] ){ bar.style.width = ( ( game.goals[3] - game.moves ) / ( game.goals[3] - game.goals[0] ) ) * maxWidth; }
    else{ bar.style.width = 0; }
    elem.appendChild(bar);
}

function showSelection(){
    if( game.sel == null ){
        let e = document.querySelectorAll(`.selected`);
        for( let i = 0; i < e.length; i++ ){ e[i].classList.remove(`selected`); }
        return;
    }
    for( let y = g.height - 1; y >= 0; y-- ){
        if( y == g.height - 1){ if( game.state[game.sel][y] !== null ){
            document.querySelector( `[data-x="${game.sel}"][data-y="${y}"]`).classList.add(`selected`);
            return;
        } }
        if( game.state[game.sel][y] !== null && game.state[game.sel][y+1] == null ){
            document.querySelector( `[data-x="${game.sel}"][data-y="${y}"]`).classList.add(`selected`);
            return;
        }
    }
}

function resetLevel(){
    setTimeout(() => { document.querySelector(`.modal`).classList.remove(`hidden`); }, 0 );
    setTimeout(() => { 
        game.state = JSON.parse( JSON.stringify( game.start ) );
        game.resets++;
        document.querySelector(`.reset`).innerHTML = `Reset [${g.resetLimit - game.resets}]`;
        game.moves = 0;
        refreshUI();
        unhung();
     }, 1250 );
}

function surrender(){
    setTimeout(() => { document.querySelector(`.modal`).classList.remove(`hidden`); }, 0 );
    setTimeout(() => {
        g.streak = 0;
        newRound();
    }, 1250 );
}

var g = {
    diff: 8
    , height: 4
    , doots: 7
    , streak: 0
    , resetLimit: 3
}

var game = {
    start: []
    , state: []
    , sel: null
    , resets: 0
    , solution: []
    , moves: 0
    , goals: []
}

var goals = [`diamond`, `gold`, `stone`, `wood` ];

function saveState(){
    localStorage.setItem( `g` , JSON.stringify( g ) );
    localStorage.setItem( `game` , JSON.stringify( game ) );
}

function loadState(){
    let gStore = JSON.parse( localStorage.getItem( `g` ) );
    let gameStore = JSON.parse( localStorage.getItem( `game` ) );
    if( gStore !== null && gameStore !== null ){
        g = gStore;
        game = gameStore;
        document.querySelector(`.modal`).innerHTML = ``;
        refreshUI();
    }
}