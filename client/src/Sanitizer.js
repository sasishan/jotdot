var Sanitizer={};

/**
 * Sanitizer which filters a set of whitelisted tags, attributes and css.
 * For now, the whitelist is small but can be easily extended.
 *
 * @param bool whether to escape or strip undesirable content.
 * @param map of allowed tag-attribute-attribute-parsers.
 * @param array of allowed css elements.
 * @param array of allowed url scheme
 */

Sanitizer.HtmlWhitelistedSanitizer = function(escape, tags, css, urls) {
  this.escape = escape;
  this.allowedTags = tags;
  this.allowedCss = css;

  // Use the browser to parse the input but create a new HTMLDocument.
  // This won't evaluate any potentially dangerous scripts since the element
  // isn't attached to the window's document. It also won't cause img.src to
  // preload images.
  //
  // To be extra cautious, you can dynamically create an iframe, pass the
  // input to the iframe and get back the sanitized string.
  this.doc = document.implementation.createHTMLDocument();

  if (urls == null) {
    urls = ['http://', 'https://'];
  }

  if (this.allowedTags == null) {
    // Configure small set of default tags
    var unconstrainted = function(x) { return x; };
    var globalAttributes = {
      'dir': unconstrainted,
      'lang': unconstrainted,
      'title': unconstrainted
    };
    var url_sanitizer = Sanitizer.makeUrlSanitizer(urls);
    this.allowedTags = {
      'a': Sanitizer.mergeMap(globalAttributes, {
          'download': unconstrainted,
          'href': url_sanitizer,
          'hreflang': unconstrainted,
          'ping': url_sanitizer,
          'rel': unconstrainted,
          'target': unconstrainted,
          'type': unconstrainted
        }),
      'img': Sanitizer.mergeMap(globalAttributes, {
          'alt': unconstrainted,
          'height': unconstrainted,
          'src': url_sanitizer,
          'width': unconstrainted
        }),
      'p': globalAttributes,
      'div': globalAttributes,
      'span': globalAttributes,
      'br': globalAttributes,
      'b': globalAttributes,
      'i': globalAttributes,
      'u': globalAttributes
    };
  }
  if (this.allowedCss == null) {
    // Small set of default css properties
    this.allowedCss = ['border', 'margin', 'padding'];
  }
}

Sanitizer.makeUrlSanitizer = function(allowed_urls) {
  return function(str) {
    if (!str) { return ''; }
    for (var i in allowed_urls) {
      // console.log(allowed_urls[i]);
      if (str.startsWith(allowed_urls[i])) {
        return str;
      }
    }
    return '';
  };
}

Sanitizer.mergeMap = function(/*...*/) {
  var r = {};
  for (var arg in arguments) {
    for (var i in arguments[arg]) {
      r[i] = arguments[arg][i];
    }
  }
  return r;
}

Sanitizer.sanitizeString = function(parser, input) {
  var div = parser.doc.createElement('div');
  div.innerHTML = input;

  // Return the sanitized version of the node.
  return (Sanitizer.sanitizeNode(parser, div)).innerHTML;
}

Sanitizer.sanitizeNode = function(parser, node) 
{
  // Note: <form> can have it's nodeName overriden by a child node. It's
  // not a big deal here, so we can punt on this.
  var node_name = node.nodeName.toLowerCase();
  if (node_name == '#text') {
    // text nodes are always safe
    return node;
  }
  if (node_name == '#comment') {
    // always strip comments
    return parser.doc.createTextNode('');
  }
  if (!parser.allowedTags.hasOwnProperty(node_name)) {
    // this node isn't allowed
    console.log("forbidden node: " + node_name);
    if (parser.escape) {
      return parser.doc.createTextNode(node.outerHTML);
    }
    return parser.doc.createTextNode('');
  }

  // create a new node
  var copy = parser.doc.createElement(node_name);

  // copy the whitelist of attributes using the per-attribute sanitizer
  for (var n_attr=0; n_attr < node.attributes.length; n_attr++) {
    var attr = node.attributes.item(n_attr).name;
    if (parser.allowedTags[node_name].hasOwnProperty(attr)) {
      var sanitizer = parser.allowedTags[node_name][attr];
      copy.setAttribute(attr, sanitizer(node.getAttribute(attr)));
    }
  }
  // copy the whitelist of css properties
  for (var css in parser.allowedCss) {
    copy.style[parser.allowedCss[css]] = node.style[parser.allowedCss[css]];
  }

  // recursively sanitize child nodes
  while (node.childNodes.length > 0) {
    var child = node.removeChild(node.childNodes[0]);
    copy.appendChild(Sanitizer.sanitizeNode(parser, child));
  }
  return copy;
}

export default Sanitizer;

// function runSanitizer() {
//   var parser = new HtmlWhitelistedSanitizer(true);
//   var sanitizedHtml = parser.sanitizeString(input.value);
//   output_as_string.textContent = sanitizedHtml;
//   output_as_node.innerHTML = sanitizedHtml;
// }