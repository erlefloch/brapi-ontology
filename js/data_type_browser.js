/**
 * BrAPI Data Type Browser
 **************************
 * A user web interface to browse BrAPI modules, categories and data types with
 * their related calls and other related data types.
 */

/**
 * Global vairables 
 *******************
 * Here is a list of global variables (g_*) and their basic structure.
 *
 * - g_brapi_data: data loaded from "data/brapi_data.json" file.
 *   {
 *      "BrAPI-<MODULE NAME1>": {
 *        "<CATEGORY NAME1>": {
 *          "Calls": {
 *            "<API CALL PATH1>": {
 *              "methods": {
 *                "<METHOD1>": {
 *                  "description": "...",
 *                  "parameters": [{
 *                    "description": "...",
 *                    "name": "<FIELD NAME>",
 *                    "schema": {
 *                      "$ref": "#/<PATH>/<DATA TYPE NAME>"
 *                      // or
 *                      "type": "<TYPE>"
 *                    },
 *                    ...
 *                  },
 *                  ...]
 *                },
 *                "<METHOD2>": {
 *                  ...
 *                },
 *                ...
 *              }
 *            },
 *            "<API CALL PATH2>": {
 *              ...
 *            },
 *            ...
 *          },
 *          "Datatypes": {
 *            "<DATA TYPE NAME1>": {
 *              "properties": {
 *                "<FIELD NAME>": {
 *                  "format": "<FORMAT>",
 *                  "type": "<TYPE>",
 *                  "description": "...",
 *                  "example": ...,
 *                },
 *                ...
 *              },
 *              "type": "..."
 *            },
 *            "<DATA TYPE NAME2>": {
 *              ...
 *            },
 *            ...
 *          }
 *        },
 *        "<CATEGORY NAME2>": {
 *          ...
 *        },
 *        ...
 *      },
 *      "BrAPI-<MODULE NAME2>": {
 *        ...
 *      },
 *      ...
 *    };
 * - g_brapi_data_types: contains data type details (calls using it, properties,
 *   ...).
 *   {
 *     "<DATA TYPE NAME1>": {
 *       "_calls": {
 *         // List of calls using this data type.
 *         "<API CALL PATH1>": {
 *           "fields": {<FIELD NAME1>: true, <FIELD NAME2>: true, ...},
 *           "object": <BOOLEAN> // True when the object is provided as
 *                                  // parameter (in POST methods)
 *         },
 *         "<API CALL PATH2>": ...,
 *         ...
 *       },
 *       "_completed": <BOOLEAN>, // True if object properties have been completely loaded.
 *       "<FIELD NAME1>": {
 *         "description": "...",
 *         type: "...",
 *         example: "..."
 *       },
 *       "<FIELD NAME2>": {
 *         ...
 *       },
 *       ...
 *     },
 *     "<DATA TYPE NAME2>": {
 *       ...
 *     },
 *     ...
 *   };
 *  
 * - g_brapi_calls: List of calls with their associated objects.
 *   {
 *     "<API CALL PATH1>": {
 *       "<DATA TYPE NAME1>": {
 *         "object": <BOOLEAN>,
 *         "fields": {
 *           "<FIELD NAME1>": true,
 *           "<FIELD NAME2>": true,
 *           ...
 *         }
 *       }, 
 *     },
 *     "<API CALL PATH2>": {
 *       ...
 *     },
 *     ...
 *   };
 *
 * - g_brapi_fields: List of fields with thier associated data types and calls.
 *   {
 *     "<FIELD NAME1>": {
 *       "calls": {
 *         "API CALL PATH1": true,
 *         "API CALL PATH2": true,
 *         ...
 *       },
 *       "data_types": {
 *         "DATA TYPE NAME1": true,
 *         "DATA TYPE NAME2": true,
 *         ...
 *       }
 *     },
 *     "<FIELD NAME2>": {
 *       ...
 *     },
 *     ...
 *   };
 *
 * - g_unprocessed_data_types: list of data type names that still need to be
 *   processed.
 *
 * - g_unprocessed_calls: list of API call paths that still need to be
 *   processed.
 */
// Variables are initialized after page loading.
var g_brapi_data = {}; // Contains data_type_browser.json.
var g_brapi_generic_fields = {"additionalInfo": true}; // Fields to ignore for relationships.
var g_brapi_data_types = {};
var g_brapi_calls = {};
var g_brapi_fields = {};
var g_unprocessed_data_types = [];
var g_unprocessed_calls = [];

/**
 * Displays field details popup.
 */
function displayFieldDetailsPopup(data_type_name, field_name) {
  var close_icon = '<div class="close-icon">❎</div>';
  var type_name = '<div><span class="header">Type:</span> <code>'
    + g_brapi_data_types[data_type_name][field_name]['type']
    + '</code></div>'
  ;
  var description = (
    g_brapi_data_types[data_type_name][field_name]['description']
    ? '<div><span class="header">Description:</span> <i>' + g_brapi_data_types[data_type_name][field_name]['description'] + '</i></div>'
    : '<div><span class="header">Description:</span> n/a</div>'
  );
  var examples =
    '<div class="brapi-example"><span class="header">Example(s):</span><br/>'
    + (g_brapi_data_types[data_type_name][field_name]['example']
      ? '<code>'
        + g_brapi_data_types[data_type_name][field_name]['example']
        + '</code>'
      : 'n/a'
    )
    + '</div>'
  ;
  var ontology = '<div><span class="header">Ontology:</span> (TODO: ontology name + term and link to ontology term)</div>';
  var issue_link = '<div class="issue-link">Questions, comments, requests: <a href="#" target="_blank">term discussion</a></div>'

  $('#brapi_popup').html(
    '<div class="brapi-data-type-details">'
    + close_icon
    + '<h3>' + field_name + ' details</h3>'
    + type_name
    + description
    + ontology
    + examples
    + issue_link
    + '</div>'
  );
  $('#brapi_popup_wrapper').show().find('.close-icon').on('click', function () {$('#brapi_popup_wrapper').hide(); });
}

/**
 * Renders a box with the given data type fields.
 */
function brapiRenderDataType(data_type_name) {
  var data_type_html = '<div class="brapi-data-type"><div class="header">' + data_type_name + '</div>';
  data_type_html += '<table class="field-table"><thead><tr><th>Field</th><th>Type</th><th>Issues</th><th></th></tr></thead><tbody>';
  //+FIXME: sort field names.
  for (var field_name in g_brapi_data_types[data_type_name]) {
    // Skip internal members.
    if (!field_name.match(/^_/)) {
      data_type_html += '<tr><td class="field-name"><div title="'
        + g_brapi_data_types[data_type_name][field_name]['description'].replace(/"/g, '&quot;')
        + '">'
        + field_name
        + '</div></td><td class="type-name">'
        + g_brapi_data_types[data_type_name][field_name]['type']
        + '</td><td class="issue-flags">'
        + '' //+FIXME: add flags '?⚠∩⨝'
        + '</td><td class="detail-link"><a href="javascript:displayFieldDetailsPopup(\'' + data_type_name + '\', \'' + field_name + '\')">view details</a></td></tr>'
      ;
    }
  }
  data_type_html += '</tbody></table>';
  data_type_html += '</div>';
  return data_type_html;
}

/**
 * Renders a box with calls related to the given data type.
 */
function brapiRenderRelatedCalls(data_type_name) {
  var related_func_html = '<div class="brapi-related"><div class="header">Related calls</div>';
  //+FIXME: sort calls names.
  var object_calls = [];
  var field_calls = [];
  for (var call_name in g_brapi_data_types[data_type_name]._calls) {
    if (g_brapi_data_types[data_type_name]._calls[call_name].object) {
      object_calls.push(call_name);
    }
    else {
      field_calls.push({"call": call_name, "fields": g_brapi_data_types[data_type_name]._calls[call_name].fields});
    }
    // related_func_html += '<div> <span class="call-name">' + call_name + '</span></div>';
  }
  object_calls = object_calls.sort();
  field_calls = field_calls.sort(function (a, b) {return new Intl.Collator().compare(a.call, b.call);});
  
  object_calls.forEach(function (oc) {
    related_func_html += '<div> <span class="call-name">' + oc + '</span></div>';
  });
  
  field_calls.forEach(function (fc) {
    var field_list = [];
    for (var field in fc.fields) {
      field_list.push(field);
    }
    related_func_html +=
      '<div> <span class="call-name">'
      + fc.call
      + '</span> (through field(s): '
      + field_list.join(', ')
      + ')</div>'
    ;
  });
  
  related_func_html += '</div>';
  return related_func_html;
}

/**
 * Processes a data type.
 * If there are inheritances and parent objects are not ready, the current
 * data type will be put back into the stack of data types to process
 * g_unprocessed_data_types.
 *
 * @see https://swagger.io/specification/
 */
function brapiFillDataType(data_type) {
  var module = data_type.module
      category = data_type.category, 
      data_type_name = data_type.name;
  g_brapi_data_types[data_type_name] = {
    "_calls": {},
    "_completed": true
  };
  for (var property_name in g_brapi_data[module][category]['Datatypes'][data_type_name]['properties']) {
    var brapi_propery = g_brapi_data[module][category]['Datatypes'][data_type_name]['properties'][property_name];
    g_brapi_data_types[data_type_name][property_name] = {
      "description": brapi_propery['description'] ?? '',
      "type": brapi_propery['type'],
      "example": brapi_propery['example'] ?? ''
    };
    // Add field reference.
    g_brapi_fields[property_name] = g_brapi_fields[property_name] ?? {
      "calls": {},
      "data_types": {},
    };
    g_brapi_fields[property_name].data_types[data_type_name] = true;
  }
  var inheritance = false;
  if (g_brapi_data[module][category]['Datatypes'][data_type_name]['allOf']) {
    inheritance = 'allOf';
  }
  else if (g_brapi_data[module][category]['Datatypes'][data_type_name]['oneOf']) {
    inheritance = 'oneOf';
  }
  else if (g_brapi_data[module][category]['Datatypes'][data_type_name]['anyOf']) {
    inheritance = 'anyOf';
  }
  // Check for inheritance.
  if (inheritance) {
    g_brapi_data[module][category]['Datatypes'][data_type_name][inheritance].forEach(function(inheritance_data) {
      // Add regular properties.
      for (var property_name in inheritance_data['properties']) {
        var brapi_propery = inheritance_data['properties'][property_name];
        g_brapi_data_types[data_type_name][property_name] = {
          "description": brapi_propery['description'] ?? '',
          "type": brapi_propery['type'],
          "example": brapi_propery['example'] ?? ''
        };
      }
      // Process inheritance if available.
      if (inheritance_data['$ref']) {
        var matches = inheritance_data['$ref'].match(/\/(\w+)$/);
        if (matches && matches[1]) {
          var inherited_data_type = matches[1];
          // Check if we got a parent and if the parent is completed.
          if (g_brapi_data_types[inherited_data_type] && g_brapi_data_types[inherited_data_type]._completed) {
            Object.assign(g_brapi_data_types[data_type_name], g_brapi_data_types[inherited_data_type]);
          }
          else {
            g_brapi_data_types[data_type_name]._completed = false;
          }
        }
      }
    });
  }
  //+FIXME handle "additionalProperties"
  // Check data type processing status.
  if (!g_brapi_data_types[data_type_name]._completed) {
    g_unprocessed_data_types.push(data_type);
  }
}

/**
 * Processes a call data.
 */
function brapiFillCall(call_ref) {
  var call_data = g_brapi_data[call_ref.module][call_ref.category]['Calls'][call_ref.call];
  g_brapi_calls[call_ref.call] = {};
  // Processes methods.
  for (var method in call_data.methods) {
    call_data.methods[method]["parameters"].forEach(function (call_parameter) {
      // Check if call parameter uses a known field name.
      if (g_brapi_fields[call_parameter['name']]
          && !g_brapi_generic_fields[call_parameter['name']]) {
        for (var data_type in g_brapi_fields[call_parameter['name']].data_types) {
          if (g_brapi_data_types[data_type]) {
            // Add call to data type related calls.
            if (!g_brapi_data_types[data_type]._calls[call_ref.call]) {
              g_brapi_data_types[data_type]._calls[call_ref.call] = {
                'fields': {},
                'object': false
              };
            }
            g_brapi_data_types[data_type]._calls[call_ref.call].fields[call_parameter['name']] = true;
          }
          else {
            console.log('WARNING: Missing data type "' + data_type + '" for call "' + call_ref.call + '"');
          }
        }
        if (call_parameter['$ref']) {
          // Process $ref
          var matches = call_parameter['$ref'].match(/\/(\w+)$/);
          if (matches && matches[1]) {
            if ('authorizationHeader' == matches[1]) {
              // +FIXME: add a properties that says call requires authentication.
            }
          }
        }
      }
      else {
        console.log('WARNING: Unknown field "' + call_parameter['name'] + '" for call "' + call_ref.call + '"');
      }
    });
    // Process "requestBody".
    if (call_data.methods[method]["requestBody"]
        && call_data.methods[method]["requestBody"]["content"]
        && call_data.methods[method]["requestBody"]["content"]["application/json"]
        && call_data.methods[method]["requestBody"]["content"]["application/json"]["schema"]
        && call_data.methods[method]["requestBody"]["content"]["application/json"]["schema"]["items"]
        && call_data.methods[method]["requestBody"]["content"]["application/json"]["schema"]["items"]["$ref"]
    ) {
      // Process $ref
      var matches = call_data.methods[method]["requestBody"]["content"]["application/json"]["schema"]["items"]["$ref"].match(/\/(\w+)$/);
      if (matches && matches[1]) {
        if (g_brapi_data_types[matches[1]]) {
          // Adds reference to call.
          if (!g_brapi_data_types[matches[1]]._calls[call_ref.call]) {
            g_brapi_data_types[matches[1]]._calls[call_ref.call] = {
              'fields': {},
              'object': true
            };
          }
          else {
            g_brapi_data_types[matches[1]]._calls[call_ref.call].object = true;
          }
        }
      }
    }
  }
  //+FIXME: Processes components.
  //+++
}

/**
 * Processes g_brapi_data to generate a menu and populates
 * g_unprocessed_data_types stack.
 */
function brapiInitMenu() {
  // Adds menu.
  var $menu = $('#bdb_left_panel');
  var $brapi_module_list = $('<ul id="brapi_module_list"></ul>')
    .appendTo($menu)
  ;
  //+FIXME: add filtering menu.
  //+FIXME: add sort.
  // Loops on module names.
  for (var brapi_module_name in g_brapi_data) {
    var $brapi_module = $('<li class="brapi-module" title="' + brapi_module_name + ' module">' + brapi_module_name + '</li>').appendTo($brapi_module_list);
    var $brapi_category_list = $('<ul></ul>').appendTo($brapi_module);
    // Loops on categories.
    for (var brapi_module_category_name in g_brapi_data[brapi_module_name]) {
      var $brapi_category = $('<li class="brapi-category" title="' + brapi_module_category_name + ' category">' + brapi_module_category_name + '</li>').appendTo($brapi_category_list);
      var $brapi_data_type_list = $('<ul></ul>').appendTo($brapi_category);
      // Loops on data types.
      for (var brapi_data_type_name in g_brapi_data[brapi_module_name][brapi_module_category_name]['Datatypes']) {
        var $brapi_data_type = $('<li class="brapi-data-type" title="' + brapi_data_type_name + ' data type">' + brapi_data_type_name + '</li>')
          .appendTo($brapi_data_type_list)
          .on('click', (function(data_type_name) {
            return function(event) {
              $('#brapi_module_list li:not(:has(ul))').removeClass('active');
              $(this).addClass('active');
              $('#bdb_view').html(
                '<div>'
                + brapiRenderDataType(data_type_name)
                + brapiRenderRelatedCalls(data_type_name)
                + '</div>'
              );
            }
          })(brapi_data_type_name))
        ;
        g_unprocessed_data_types.push({
          module:   brapi_module_name,
          category: brapi_module_category_name,
          name:     brapi_data_type_name
        });
      }
      // Loops on calls.
      for (var brapi_call_path in g_brapi_data[brapi_module_name][brapi_module_category_name]['Calls']) {
        g_unprocessed_calls.push({
          module:   brapi_module_name,
          category: brapi_module_category_name,
          call:     brapi_call_path
        });
      }
    }
  }
  
  // Manages menu collapse.
  $menu.find('li')
    .on('click', function(event) {
      $(this).find('>ul').toggle();
      if ($(this).find('>ul:visible').length) {
        $(this).css('list-style-type', 'disclosure-open');
      }
      else if ($(this).find('>ul:hidden').length) {
        $(this).css('list-style-type', 'disclosure-closed');
      }
      event.stopPropagation();
    })
    .css('cursor', 'pointer')
  ;
  // Hide menu items by default.
  $('#brapi_module_list ul').hide();
  $('#brapi_module_list li:has(ul)').css('list-style-type', 'disclosure-closed');
  // Identify leaves.
  $('#brapi_module_list li:not(:has(ul))').addClass('leaf');
}

/**
 * Processes g_unprocessed_data_types populated by brapiInitMenu().
 */
function brapiInitDataTypes() {
  var stack_size = 0;
  // Loop while there are elements to process (handles inheritance).
  while (g_unprocessed_data_types.length
    && g_unprocessed_data_types.length != stack_size) {
    // Clone stack.
    var stack = g_unprocessed_data_types;
    // Keep track of stack size to prevent infinite trials.
    stack_size = stack.length;
    // Empty current stack.
    g_unprocessed_data_types = [];
    // Process every element of the stack.
    stack.forEach(function (data_type) {
      brapiFillDataType(data_type);
    });
  }
}

/**
 * Processes g_unprocessed_calls populated by brapiInitMenu().
 */
function brapiInitCalls() {
  // Process every element of the stack.
  g_unprocessed_calls.forEach(function (call_ref) {
    brapiFillCall(call_ref);
  });
}

// Initialize the whole broswer.
$(function() {
  console.log('BrAPI Data Type Browser Initialization');
  $("#bdb_view").html('<div>Initialization - Please wait...</div>');
  // $.getJSON("data/brapi_data.json", function(data) {
  $.getJSON("https://plantbreeding.github.io/brapi-ontology/data/brapi_data.json", function(data) {
    g_brapi_data = data;
    brapiInitMenu();
    brapiInitDataTypes();
    brapiInitCalls();
    // Hides popup on outside clicks.
    $('#brapi_popup_wrapper').on('click', function () {
      $(this).hide();
    });
    // Do not hide popup when clicked.
    $('#brapi_popup').on('click', function (event) {event.stopPropagation();});

    $("#bdb_view").html('<div>Ready. Use left menu to browse data types.</div>');
    console.log('BDTB Initialization done.');
  });
});
