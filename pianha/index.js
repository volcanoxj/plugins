var domain = "https://www.anqu.fun";
var tabs = {"电影":"1","电视剧":"2","动漫":"4","综艺":"3"};
let bars = {"1":"电影","2":"电视剧","4":"动漫","3":"综艺"};
var filters = {};

function kinds() {
  return ["电影","电视剧","动漫","综艺"];
}

async function tags(bar) {
  let kind = tabs[bar]??"1";
  let lines = filters[kind];
  if (lines) return lines.map((items)=> items.map(({text})=> text));;
  let uri = `${domain}/vodshow/${kind}-----------.html`;
  console.log(uri);
  let res = await fetch(uri);
  let html = await res.text();
  lines = [];
  Cheerio.parse(html, function($){
    $('ul.stui-screen__list').each(function(kind, index){
      let items = [];
      $('li>a', kind).each(function(item){
        let href = item.attr('href');
        let text = item.text();
        let index = href.lastIndexOf('/');
        let slice = href.substring(index+1, href.lastIndexOf('.')).split("-");
        items.push({text, href, slice});
        // console.log(text, href, slice);
      });
      switch(index) {
        case 0: {
          lines.push(items.map(({text, slice})=> ({text, index, value: slice[0]})));
        } break;
        case 1: {
          lines.push(items.map(({text, slice})=> ({text, index, value:slice[1]})));
        } break;
        case 2: {
          lines.push(items.map(({text, slice})=> ({text, index, value:slice[11]})));
        }
      }
    });
  });
  filters[kind] = lines;
  return lines.map((items)=> items.map(({text})=> text));
}

async function reality(uri) {
  uri = `${domain}/vodplay/${uri}.html`;
  console.log("uri0", uri)
  let res = await fetch(uri);
  if ( !res.ok ) {
    return "";
  }
  let html = await res.text();
  console.log(html);
  uri = (/player_aaaa.+"url":\s*"([^"]+)"/.exec(html)||[])[1];
  console.log("uri1", uri)
  if ( !uri ) {
    return "";
  }
  if (/:\/\//.test(uri)) {
    return uri;
  }
  res = await fetch(`https://blue.maclsj.com/blue/index.php?url=${uri}`);
  if (res.headers.has("location")) {
    uri = res.headers.get('location');
    uri = (/\?url=(.+)$/.exec(uri)||[null, uri])[1];
    console.log(uri)
    return uri;
  }
  return "";
}

async function index() {
  let uri = `${domain}`;
  let res = await fetch(uri);
  let html = await res.text();
  let hots = [];
  let news = {};
  Cheerio.parse(html, function($){
    $('div.carousel>div.list>a').each(function(item){
      let href = $(item).attr('href');
      let title = $(item).attr('title');
      let style = $(item).attr('style');
      let image = (/background\s*:\s*url\(([^\)]+)\)/.exec(style)||[])[1];
      let id = (/(\d+).html/.exec(href)||[])[1];
      console.log(id, title, image);
      hots.push({id, name: title, image});
    });

    $('div.stui-pannel-box').each(function(pannel){
      let bar = (/(\d+)[\-]+.html/.exec($('div.stui-pannel__head>.title>a', pannel).attr('href'))||[])[1];
      if ( !bar ) return;
      let kind = bars[bar];
      if ( !kind ) return;
      console.log('kind:', kind);
      let vodlist = [];
      $('a.stui-vodlist__thumb', pannel).each(function(info){
        let id = (/(\d+).html/.exec(info.attr('href'))||[])[1];
        let name = info.attr('title');
        let image = info.attr('data-original');
        let statue = info.text();
        console.log(id, name, statue, image);
        vodlist.push({id, name, statue, image});
      });
      if ( vodlist.length == 0) return;
      news[kind] = vodlist;
    });
  });
  return {hots, news};
}

async function search(keyword, page, limit) {
  let slice = '-------------'.split('-');
  // https://www.anqu.fun/vodsearch/%E6%97%B6%E9%97%B4----------2---.html
  // https://www.anqu.fun/vodsearch/%E6%97%B6%E9%97%B4-------------.html
  slice[0] = encodeURIComponent(keyword.trim());
  slice[10] = page<=0?1:page;
  let uri = `${domain}/vodsearch/${slice.join('-')}.html`;
  console.log(uri);
  let res = await fetch(uri);
  let html = await res.text();
  let items = [];
  return Cheerio.parse(html, function($){
    $('a.stui-vodlist__thumb').each(function(info){
      let id = (/(\d+).html/.exec(info.attr('href'))||[])[1];
        let name = info.attr('title');
        let image = info.attr('data-original');
        let statue = info.text();
        console.log(id, name, statue, image);
        items.push({id, name, statue, image});
    });
    let [page, pages] = $('ul.stui-page>li.visible-xs').text().split('/');
    return {items, page:+(page||1), pages:+(pages||1)};
  });
}

async function filter(kind, tags, page, limit) {
  let tab = tabs[kind];
  let slice = '-----------'.split('-');
  let lines = filters[tab];
  for(let i in tags) {
    let tag = tags[i];
    console.log(tag, lines[+i]);
    let {value} = lines[+i].find(({text, value})=> text==tag?value:undefined)||{value:""};
    switch (+i) {
    case 0: slice[0] = value; break;
    case 1: slice[1] = value; break;
    case 2: slice[11] = value; break;
    }
  }
  if (page <= 0) page = 1;
  slice[8] = page;
  let uri = `${domain}/vodshow/${slice.join('-')}.html`;
  console.log(uri);
  let res = await fetch(uri);
  let html = await res.text();
  let items = [];
  return Cheerio.parse(html, function($){
    $('a.stui-vodlist__thumb', 'ul.stui-vodlist').each(function(info){
      let id = (/(\d+).html/.exec(info.attr('href'))||[])[1];
        let name = info.attr('title');
        let image = info.attr('data-original');
        let statue = info.text();
        console.log(id, name, statue, image);
        items.push({id, name, statue, image});
    });
    let [page, pages] = $('ul.stui-page>li.visible-xs').text().split('/');
    return {items, page:+(page||1), pages:+(pages||1)};
  });
}

async function details(id) {
  let uri = `${domain}/voddetail/${id}.html`;
  console.log(uri);
  let res = await fetch(uri);
  let html = await res.text();
  return Cheerio.parse(html, function($){
    let kind = $('ul.stui-header__menu>li.active>a').text();
    let thumb = $('div.stui-content__thumb>a.stui-vodlist__thumb');
    let id = (/\/(\d+)/.exec(thumb.attr('href'))||[])[1];
    let name = thumb.attr('title');
    let image = $('div.stui-content__thumb>a.stui-vodlist__thumb>img').attr('data-original');
    let statue = $('.text-right', thumb).text();
    let info = {kind, id, name, image, statue};
    $('div.stui-content__detail>p.data').each(function(field){
      let slice = field.text().trim().split(/\s+/);
      let label = "";
      let values = [];
      for(let i = 0; i < slice.length; i++) {
        let item = slice[i];
        let fields = item.split('：');
        if (fields.length == 1) {
          if (item.length > 0) {
            values.push(item);
          }
          continue;
        }
        if ( values.length > 0 ) {
          switch(label) {
            case '类型': info.tags = values.map((e)=> e.trim()).join(' / '); break;
            case '地区': info.area = values[0]??'未知'; break;
            case '年份': info.year = values[0]??'未知'; break;
            case '主演': info.actors = values.map((e)=> e.trim()).join(' / '); break;
            case '导演': info.directors = values.map((e)=> e.trim()).join(' / '); break;
          }
          values.splice(0, values.length);
        }
        label = fields[0];
        if (fields[1].length == 0) continue;
        values.push(fields[1]);
      }
      if ( values.length > 0 ) {
        switch(label) {
          case '类型': info.tags = values.map((e)=> e.trim()).join(' / '); break;
          case '地区': info.area = values[0]??'未知'; break;
          case '年份': info.year = values[0]??'未知'; break;
          case '主演': info.actors = values.map((e)=> e.trim()).join(' / '); break;
          case '导演': info.directors = values.map((e)=> e.trim()).join(' / '); break;
        }
      }
    });
    info.plot = $('div.stui-pannel_bd', "#desc").text().trim();
    let lines = [];
    $('div.playlist').each(function(card){
      let line = $('div.stui-pannel_hd', card).text();
      let episodes = [];
      $('li>a',card).each(function(a){
        let label = a.text();
        let value = (/\/([^\/]+)\.html/.exec(a.attr('href'))||[])[1];
        episodes.push({label, uri: value});
      });
      lines.push({name: line, episodes});
    });
    info.source = lines;
    let items = [];
    $('a.stui-vodlist__thumb','ul.stui-vodlist__bd').each(function(info){
      let id = (/(\d+).html/.exec(info.attr('href'))||[])[1];
      let name = info.attr('title');
      let image = info.attr('data-original');
      let statue = info.text();
      items.push({id, name, statue, image});
    });
    info.items = items;
    console.log(info);
    return info;
  });
}