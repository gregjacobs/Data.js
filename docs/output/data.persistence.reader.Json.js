Ext.data.JsonP.data_persistence_reader_Json({"tagname":"class","name":"data.persistence.reader.Json","extends":"data.persistence.reader.Reader","mixins":[],"alternateClassNames":[],"aliases":{},"singleton":false,"requires":[],"uses":[],"enum":null,"override":null,"inheritable":null,"inheritdoc":null,"meta":{},"private":null,"id":"class-data.persistence.reader.Json","members":{"cfg":[{"name":"dataMappings","tagname":"cfg","owner":"data.persistence.reader.Reader","meta":{},"id":"cfg-dataMappings"},{"name":"dataProperty","tagname":"cfg","owner":"data.persistence.reader.Reader","meta":{},"id":"cfg-dataProperty"},{"name":"messageProperty","tagname":"cfg","owner":"data.persistence.reader.Reader","meta":{},"id":"cfg-messageProperty"},{"name":"totalProperty","tagname":"cfg","owner":"data.persistence.reader.Reader","meta":{},"id":"cfg-totalProperty"}],"property":[],"method":[{"name":"constructor","tagname":"method","owner":"data.persistence.reader.Reader","meta":{},"id":"method-constructor"},{"name":"applyDataMappings","tagname":"method","owner":"data.persistence.reader.Reader","meta":{"protected":true},"id":"method-applyDataMappings"},{"name":"convertRaw","tagname":"method","owner":"data.persistence.reader.Json","meta":{"protected":true},"id":"method-convertRaw"},{"name":"extractMessage","tagname":"method","owner":"data.persistence.reader.Reader","meta":{},"id":"method-extractMessage"},{"name":"extractRecords","tagname":"method","owner":"data.persistence.reader.Reader","meta":{},"id":"method-extractRecords"},{"name":"extractTotalCount","tagname":"method","owner":"data.persistence.reader.Reader","meta":{},"id":"method-extractTotalCount"},{"name":"findPropertyValue","tagname":"method","owner":"data.persistence.reader.Reader","meta":{"protected":true},"id":"method-findPropertyValue"},{"name":"parsePathString","tagname":"method","owner":"data.persistence.reader.Reader","meta":{"protected":true},"id":"method-parsePathString"},{"name":"processRecord","tagname":"method","owner":"data.persistence.reader.Reader","meta":{"protected":true,"template":true},"id":"method-processRecord"},{"name":"processRecords","tagname":"method","owner":"data.persistence.reader.Reader","meta":{"protected":true,"template":true},"id":"method-processRecords"},{"name":"read","tagname":"method","owner":"data.persistence.reader.Reader","meta":{},"id":"method-read"}],"event":[],"css_var":[],"css_mixin":[]},"linenr":9,"files":[{"filename":"Json.js","href":"Json.html#data-persistence-reader-Json"}],"html_meta":{},"statics":{"cfg":[],"property":[],"method":[],"event":[],"css_var":[],"css_mixin":[]},"component":false,"superclasses":["data.persistence.reader.Reader"],"subclasses":[],"mixedInto":[],"parentMixins":[],"html":"<div><pre class=\"hierarchy\"><h4>Hierarchy</h4><div class='subclass first-child'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='docClass'>data.persistence.reader.Reader</a><div class='subclass '><strong>data.persistence.reader.Json</strong></div></div><h4>Files</h4><div class='dependency'><a href='source/Json.html#data-persistence-reader-Json' target='_blank'>Json.js</a></div></pre><div class='doc-contents'><p>JSON flavor reader which treats raw text data as JSON, and converts it to a JavaScript\nobject.</p>\n\n<p>See <a href=\"#!/api/data.persistence.reader.Reader\" rel=\"data.persistence.reader.Reader\" class=\"docClass\">data.persistence.reader.Reader</a> for more information on readers.</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-cfg'>Config options</h3><div class='subsection'><div id='cfg-dataMappings' class='member first-child inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-cfg-dataMappings' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Reader-cfg-dataMappings' class='name expandable'>dataMappings</a><span> : Object</span></div><div class='description'><div class='short'>An Object which maps raw data property names to the target attribute\nnames of the data.Model which will be populated ...</div><div class='long'><p>An Object which maps raw data property names to the target <a href=\"#!/api/data.Model-cfg-attributes\" rel=\"data.Model-cfg-attributes\" class=\"docClass\">attribute</a>\nnames of the <a href=\"#!/api/data.Model\" rel=\"data.Model\" class=\"docClass\">data.Model</a> which will be populated as a result of the <a href=\"#!/api/data.persistence.reader.Reader-method-read\" rel=\"data.persistence.reader.Reader-method-read\" class=\"docClass\">read</a>.</p>\n\n<p>For example, if we have a model defined as such:</p>\n\n<pre><code>var Person = Model.extend( {\n    attributes : [ 'id', 'name' ]\n} );\n</code></pre>\n\n<p>And the raw data that comes from a server (after being transformed by <a href=\"#!/api/data.persistence.reader.Reader-method-convertRaw\" rel=\"data.persistence.reader.Reader-method-convertRaw\" class=\"docClass\">convertRaw</a> into a plain\nJavaScript object) looks like this:</p>\n\n<pre><code>{\n    personId   : 10,\n    personName : \"John Smith\"\n}\n</code></pre>\n\n<p>Then we could set the <code>dataMappings</code> property to be the following, to automatically map the data to the\ncorrect target property (attribute) names:</p>\n\n<pre><code>dataMappings : {\n    'personId'   : 'id',\n    'personName' : 'name'\n}\n</code></pre>\n\n<p>The key names in this map are the raw data property names, and the values are the target property\n(attribute) names. Note that all raw properties do not need to be specified; only the ones you want\nmapped.</p>\n\n<h3>Mapping to Nested Objects</h3>\n\n<p>The key names in the map may be a dot-delimited path to a nested object in the data record. Using the above\n<code>Person</code> model, say we were reading raw data that looked like this:</p>\n\n<pre><code>{\n    personId : 10,\n    personInfo : {\n        name : \"John Smith\"\n    }\n}\n</code></pre>\n\n<p>The <code>dataMappings</code> config to read this raw data would then look like this:</p>\n\n<pre><code>dataMappings : {\n    'personId'        : 'id',\n    'personInfo.name' : 'name',\n\n    'personInfo' : ''  // note, nested objects which have properties mapped to them are not automatically\n                       // removed (yet), so remove it manually by setting this top level key to an empty string. \n                       // See \"Removing Unneeded Source Properties\" below.\n}\n</code></pre>\n\n<h4>Escaping for Dots ('.') in the Raw Property Name</h4>\n\n<p>If there are properties in the raw data that have dots (periods) as part of their names, then the dots in the\nmappings may be escaped with a backslash. However, in string literals in the map, this must be a double backslash\nto get the actual backslash character. Say we were consuming this raw data:</p>\n\n<pre><code>{\n    'person.id'   : 10,\n    'person.name' : \"John Smith\"\n}\n</code></pre>\n\n<p>Then our <code>dataMappings</code> would look like this:</p>\n\n<pre><code>dataMappings : {\n    'person\\\\.id'   : 'id',\n    'person\\\\.name' : 'name'\n}\n</code></pre>\n\n<h3>Removing Unneeded Source Properties</h3>\n\n<p>There is a special form for removing source data properties that are unneeded, so that they do not get\nset to the target <a href=\"#!/api/data.Model\" rel=\"data.Model\" class=\"docClass\">data.Model</a> (which by default, would throw an error for an unknown attribute).\nSetting the value in the map to an empty string will remove the particular source data property as part\nof the mapping process. Ex:</p>\n\n<pre><code>dataMappings : {\n    'personId'   : 'id',\n    'personName' : 'name',\n\n    'lastDentalAppointmentDate' : ''  // we don't need this... remove this property from the raw data\n                                      // so it doesn't attempt to be set to our Person model\n}\n</code></pre>\n\n<h3>More Advanced Transformations</h3>\n\n<p>If you need more advanced transformations than the <code>dataMappings</code> config provides, override the\n<a href=\"#!/api/data.persistence.reader.Reader-method-processRecord\" rel=\"data.persistence.reader.Reader-method-processRecord\" class=\"docClass\">processRecord</a> method in a subclass. See <a href=\"#!/api/data.persistence.reader.Reader-method-processRecord\" rel=\"data.persistence.reader.Reader-method-processRecord\" class=\"docClass\">processRecord</a> for details.</p>\n</div></div></div><div id='cfg-dataProperty' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-cfg-dataProperty' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Reader-cfg-dataProperty' class='name expandable'>dataProperty</a><span> : String</span></div><div class='description'><div class='short'>The name of the property which contains the data record(s) from the raw data. ...</div><div class='long'><p>The name of the property which contains the data record(s) from the raw data. This may be a\ndot-delimited string to a nested property, if applicable. If the property has a dot (period)\nas part of the name, it may be escaped with a backslash, which should be a double backslash inside\na string literal (ex: \"data\\.property\").</p>\n\n<p>This property name references the data when it is in JavaScript object form, <em>after</em> it has been\nconverted by the <a href=\"#!/api/data.persistence.reader.Reader-method-convertRaw\" rel=\"data.persistence.reader.Reader-method-convertRaw\" class=\"docClass\">convertRaw</a> method.</p>\n\n<p>Defaults to '.', meaning the record(s) data is at the root level of the data.</p>\n<p>Defaults to: <code>'.'</code></p></div></div></div><div id='cfg-messageProperty' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-cfg-messageProperty' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Reader-cfg-messageProperty' class='name expandable'>messageProperty</a><span> : String</span></div><div class='description'><div class='short'>The name of the property (if there is one) which holds an optional message to be stored with the\nResultSet that is re...</div><div class='long'><p>The name of the property (if there is one) which holds an optional message to be stored with the\n<a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">ResultSet</a> that is returned from the <a href=\"#!/api/data.persistence.reader.Reader-method-read\" rel=\"data.persistence.reader.Reader-method-read\" class=\"docClass\">read</a> method.</p>\n\n<p>This property name references the data when it is in JavaScript object form, <em>after</em> it has been\nconverted by the <a href=\"#!/api/data.persistence.reader.Reader-method-convertRaw\" rel=\"data.persistence.reader.Reader-method-convertRaw\" class=\"docClass\">convertRaw</a> method.</p>\n\n<p>This may be a dot-delimited string to a nested property, if applicable. If the property has a dot (period)\nas part of the name, it may be escaped with a backslash, which should be a double backslash inside\na string literal (ex: \"metadata\\.message\"). If left as an empty string, no message metadata will be read.</p>\n<p>Defaults to: <code>''</code></p></div></div></div><div id='cfg-totalProperty' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-cfg-totalProperty' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Reader-cfg-totalProperty' class='name expandable'>totalProperty</a><span> : String</span></div><div class='description'><div class='short'>The name of the property (if there is one) which holds the metadata for the total number of records\non the backing co...</div><div class='long'><p>The name of the property (if there is one) which holds the metadata for the total number of records\non the backing collection (such as a server-side database). This is used for loading windowed (paged)\ndatasets, and is only needed if not loading all of the data at once.</p>\n\n<p>This property name references the data when it is in JavaScript object form, <em>after</em> it has been\nconverted by the <a href=\"#!/api/data.persistence.reader.Reader-method-convertRaw\" rel=\"data.persistence.reader.Reader-method-convertRaw\" class=\"docClass\">convertRaw</a> method.</p>\n\n<p>This may be a dot-delimited string to a nested property, if applicable. If the property has a dot (period)\nas part of the name, it may be escaped with a backslash, which should be a double backslash inside\na string literal (ex: \"metadata\\.total\"). If left as an empty string, no total count metadata will be read.</p>\n<p>Defaults to: <code>''</code></p></div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/data.persistence.reader.Reader-method-constructor' class='name expandable'>data.persistence.reader.Json</a>( <span class='pre'>config</span> ) : <a href=\"#!/api/data.persistence.reader.Reader\" rel=\"data.persistence.reader.Reader\" class=\"docClass\">data.persistence.reader.Reader</a></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>config</span> : Object<div class='sub-desc'><p>The configuration options for this class, specified in an Object (map).</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/data.persistence.reader.Reader\" rel=\"data.persistence.reader.Reader\" class=\"docClass\">data.persistence.reader.Reader</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-applyDataMappings' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-method-applyDataMappings' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Reader-method-applyDataMappings' class='name expandable'>applyDataMappings</a>( <span class='pre'>recordData</span> ) : Object<strong class='protected signature' >protected</strong></div><div class='description'><div class='short'>Utility method which applies the dataMappings to a given record (i.e. ...</div><div class='long'><p>Utility method which applies the <a href=\"#!/api/data.persistence.reader.Reader-cfg-dataMappings\" rel=\"data.persistence.reader.Reader-cfg-dataMappings\" class=\"docClass\">dataMappings</a> to a given record (i.e. the plain\nobject that holds the properties which will be later set to a <a href=\"#!/api/data.Model\" rel=\"data.Model\" class=\"docClass\">data.Model</a>.</p>\n\n<p>This method is by default, executed by <a href=\"#!/api/data.persistence.reader.Reader-method-processRecord\" rel=\"data.persistence.reader.Reader-method-processRecord\" class=\"docClass\">processRecord</a> (unless <a href=\"#!/api/data.persistence.reader.Reader-method-processRecord\" rel=\"data.persistence.reader.Reader-method-processRecord\" class=\"docClass\">processRecord</a>\nis redefined in a subclass).</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>recordData</span> : Object<div class='sub-desc'>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Object</span><div class='sub-desc'><p>The <code>recordData</code> with the <a href=\"#!/api/data.persistence.reader.Reader-cfg-dataMappings\" rel=\"data.persistence.reader.Reader-cfg-dataMappings\" class=\"docClass\">dataMappings</a> applied.</p>\n</div></li></ul></div></div></div><div id='method-convertRaw' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.reader.Json'>data.persistence.reader.Json</span><br/><a href='source/Json.html#data-persistence-reader-Json-method-convertRaw' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Json-method-convertRaw' class='name expandable'>convertRaw</a>( <span class='pre'>rawData</span> ) : Object<strong class='protected signature' >protected</strong></div><div class='description'><div class='short'>Abstract method which should be implemented to take the raw data, and convert it into\na JavaScript Object. ...</div><div class='long'><p>Abstract method which should be implemented to take the raw data, and convert it into\na JavaScript Object.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>rawData</span> : Mixed<div class='sub-desc'><p>Either a string of JSON, or a JavaScript Object. If a JavaScript\n  Object is provided, it will simply be returned.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Object</span><div class='sub-desc'><p>The resulting Object as a result of parsing the JSON.</p>\n</div></li></ul><p>Overrides: <a href='#!/api/data.persistence.reader.Reader-method-convertRaw' rel='data.persistence.reader.Reader-method-convertRaw' class='docClass'>data.persistence.reader.Reader.convertRaw</a></p></div></div></div><div id='method-extractMessage' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-method-extractMessage' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Reader-method-extractMessage' class='name expandable'>extractMessage</a>( <span class='pre'>data</span> ) : String</div><div class='description'><div class='short'>Extracts the message metadata (if any) from the JavaScript object produced as a result of\nconvertRaw. ...</div><div class='long'><p>Extracts the message metadata (if any) from the JavaScript object produced as a result of\n<a href=\"#!/api/data.persistence.reader.Reader-method-convertRaw\" rel=\"data.persistence.reader.Reader-method-convertRaw\" class=\"docClass\">convertRaw</a>. The default implementation uses the <a href=\"#!/api/data.persistence.reader.Reader-cfg-messageProperty\" rel=\"data.persistence.reader.Reader-cfg-messageProperty\" class=\"docClass\">messageProperty</a> config to pull\nout and return the message.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>data</span> : Object<div class='sub-desc'><p>The JavaScript form of the raw data (converted by <a href=\"#!/api/data.persistence.reader.Reader-method-convertRaw\" rel=\"data.persistence.reader.Reader-method-convertRaw\" class=\"docClass\">convertRaw</a>).</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>String</span><div class='sub-desc'><p>The message metadata, if any. Returns <code>undefined</code> if none was found.</p>\n</div></li></ul></div></div></div><div id='method-extractRecords' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-method-extractRecords' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Reader-method-extractRecords' class='name expandable'>extractRecords</a>( <span class='pre'>data</span> ) : Object[]</div><div class='description'><div class='short'>Extracts the records' data from the JavaScript object produced as a result of convertRaw. ...</div><div class='long'><p>Extracts the records' data from the JavaScript object produced as a result of <a href=\"#!/api/data.persistence.reader.Reader-method-convertRaw\" rel=\"data.persistence.reader.Reader-method-convertRaw\" class=\"docClass\">convertRaw</a>.\nThe default implementation uses the <a href=\"#!/api/data.persistence.reader.Reader-cfg-dataProperty\" rel=\"data.persistence.reader.Reader-cfg-dataProperty\" class=\"docClass\">dataProperty</a> config to pull out the object which holds\nthe record(s) data.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>data</span> : Object<div class='sub-desc'><p>The JavaScript form of the raw data (converted by <a href=\"#!/api/data.persistence.reader.Reader-method-convertRaw\" rel=\"data.persistence.reader.Reader-method-convertRaw\" class=\"docClass\">convertRaw</a>).</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Object[]</span><div class='sub-desc'><p>The data records. If a single record is found, it is wrapped in an array\n  (forming a one element array).</p>\n</div></li></ul></div></div></div><div id='method-extractTotalCount' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-method-extractTotalCount' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Reader-method-extractTotalCount' class='name expandable'>extractTotalCount</a>( <span class='pre'>data</span> ) : Number</div><div class='description'><div class='short'>Extracts the total count metadata (if any) from the JavaScript object produced as a result of\nconvertRaw. ...</div><div class='long'><p>Extracts the total count metadata (if any) from the JavaScript object produced as a result of\n<a href=\"#!/api/data.persistence.reader.Reader-method-convertRaw\" rel=\"data.persistence.reader.Reader-method-convertRaw\" class=\"docClass\">convertRaw</a>. The default implementation uses the <a href=\"#!/api/data.persistence.reader.Reader-cfg-totalProperty\" rel=\"data.persistence.reader.Reader-cfg-totalProperty\" class=\"docClass\">totalProperty</a> config to pull\nout and return the totalCount value.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>data</span> : Object<div class='sub-desc'><p>The JavaScript form of the raw data (converted by <a href=\"#!/api/data.persistence.reader.Reader-method-convertRaw\" rel=\"data.persistence.reader.Reader-method-convertRaw\" class=\"docClass\">convertRaw</a>).</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Number</span><div class='sub-desc'><p>The total count. Returns <code>undefined</code> if no total count metadata property\n  was found.</p>\n</div></li></ul></div></div></div><div id='method-findPropertyValue' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-method-findPropertyValue' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Reader-method-findPropertyValue' class='name expandable'>findPropertyValue</a>( <span class='pre'>obj, propertyPath</span> ) : Mixed<strong class='protected signature' >protected</strong></div><div class='description'><div class='short'>Utility method which searches for a (possibly nested) property in a data object. ...</div><div class='long'><p>Utility method which searches for a (possibly nested) property in a data object.\nThe <code>propertyName</code> parameter accepts a dot-delimited string, which accesses a property\ndeep within the object structure. For example: a <code>propertyName</code> of 'foo.bar' will access\nproperty 'foo' from the <code>obj</code> provided, and then the property 'bar' from 'foo'.</p>\n\n<p>Dots may be escaped by a backslash (specified as a double backslash in a string literal)\nso that property names which have dots within them may be accessed. For example, a\n<code>propertyName</code> of 'foo\\.bar' will access the property \"foo.bar\" from the <code>obj</code> provided.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>obj</span> : Object<div class='sub-desc'><p>The object to search.</p>\n</div></li><li><span class='pre'>propertyPath</span> : String<div class='sub-desc'><p>A single property name, or dot-delimited path to access nested properties.\n  Dots escaped with a backslash will be taken as literal dots (i.e. not as nested keys).</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Mixed</span><div class='sub-desc'><p>The value at the <code>propertyName</code>. If the property is not found, returns\n  <code>undefined</code>.</p>\n</div></li></ul></div></div></div><div id='method-parsePathString' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-method-parsePathString' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Reader-method-parsePathString' class='name expandable'>parsePathString</a>( <span class='pre'>pathString</span> ) : String[]<strong class='protected signature' >protected</strong></div><div class='description'><div class='short'>Utility method to parse a dot-delimited object path string into a list of nested keys. ...</div><div class='long'><p>Utility method to parse a dot-delimited object path string into a list of nested keys. Dots\nin the string which are prefixed by a backslash are taken literally. (Note: for escaped dots,\nneed to specify a double backslash in JS string literals.)</p>\n\n<p>Ex:</p>\n\n<pre><code>'prop' -&gt; [ 'prop' ]\n'prop.nested' -&gt; [ 'prop', 'nested' ]\n'prop.nested.deepNested' -&gt; [ 'prop', 'nested', 'deepNested' ]\n'prop\\\\.value' -&gt; [ 'prop.value' ]\n'prop.nested.namespace\\\\.value' -&gt; [ 'prop', 'nested', 'namespace.value' ]\n</code></pre>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>pathString</span> : String<div class='sub-desc'><p>The dot-delimited path string.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>String[]</span><div class='sub-desc'><p>A list (array) of the nested keys.</p>\n</div></li></ul></div></div></div><div id='method-processRecord' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-method-processRecord' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Reader-method-processRecord' class='name expandable'>processRecord</a>( <span class='pre'>recordData</span> ) : Object<strong class='protected signature' >protected</strong><strong class='template signature' >template</strong></div><div class='description'><div class='short'>Hook method which may be overridden to process the data of a single record. ...</div><div class='long'><p>Hook method which may be overridden to process the data of a single record.\nThis method, by default, applies any data mappings specified in a <a href=\"#!/api/data.persistence.reader.Reader-cfg-dataMappings\" rel=\"data.persistence.reader.Reader-cfg-dataMappings\" class=\"docClass\">dataMappings</a>\nconfig (by calling <a href=\"#!/api/data.persistence.reader.Reader-method-applyDataMappings\" rel=\"data.persistence.reader.Reader-method-applyDataMappings\" class=\"docClass\">applyDataMappings</a>, and then returns the newly transformed record\nobject. If overriding this method in a subclass, call this superclass method when you want\nthe <a href=\"#!/api/data.persistence.reader.Reader-cfg-dataMappings\" rel=\"data.persistence.reader.Reader-cfg-dataMappings\" class=\"docClass\">dataMappings</a> to be applied (and any other future config-driven transformations\nthat may be implemented).</p>\n\n<p>This method, by default, is called once for each record in the data. This is unless\n<a href=\"#!/api/data.persistence.reader.Reader-method-processRecords\" rel=\"data.persistence.reader.Reader-method-processRecords\" class=\"docClass\">processRecords</a> has been redefined in a subclass, and the records are handled\ndifferently.</p>\n      <div class='signature-box template'>\n      <p>This is a <a href=\"#!/guide/components\">template method</a>.\n         a hook into the functionality of this class.\n         Feel free to override it in child classes.</p>\n      </div>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>recordData</span> : Object<div class='sub-desc'>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Object</span><div class='sub-desc'><p>The <code>recordData</code> with any transformations applied.</p>\n</div></li></ul></div></div></div><div id='method-processRecords' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-method-processRecords' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Reader-method-processRecords' class='name expandable'>processRecords</a>( <span class='pre'>records</span> ) : Object[]<strong class='protected signature' >protected</strong><strong class='template signature' >template</strong></div><div class='description'><div class='short'>Hook method which may be overridden to process the list of records in the data. ...</div><div class='long'><p>Hook method which may be overridden to process the list of records in the data.\nThis method, by default, simply calls <a href=\"#!/api/data.persistence.reader.Reader-method-processRecord\" rel=\"data.persistence.reader.Reader-method-processRecord\" class=\"docClass\">processRecord</a> with each record in\nthe data, but may be overridden to apply transformations to the records list as\na whole. If your intention is to transform each record (model) one by one, override\n<a href=\"#!/api/data.persistence.reader.Reader-method-processRecord\" rel=\"data.persistence.reader.Reader-method-processRecord\" class=\"docClass\">processRecord</a> instead.</p>\n      <div class='signature-box template'>\n      <p>This is a <a href=\"#!/guide/components\">template method</a>.\n         a hook into the functionality of this class.\n         Feel free to override it in child classes.</p>\n      </div>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>records</span> : Object[]<div class='sub-desc'>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Object[]</span><div class='sub-desc'><p>The <code>records</code> with any transformations applied.</p>\n</div></li></ul></div></div></div><div id='method-read' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.reader.Reader' rel='data.persistence.reader.Reader' class='defined-in docClass'>data.persistence.reader.Reader</a><br/><a href='source/Reader.html#data-persistence-reader-Reader-method-read' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.reader.Reader-method-read' class='name expandable'>read</a>( <span class='pre'>rawData</span> ) : <a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a></div><div class='description'><div class='short'>Reads the raw data/metadata, and returns a data.persistence.ResultSet object which holds the data\nin JavaScript Objec...</div><div class='long'><p>Reads the raw data/metadata, and returns a <a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a> object which holds the data\nin JavaScript Object form, along with any of the metadata present.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>rawData</span> : Mixed<div class='sub-desc'><p>The raw data to transform.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a></span><div class='sub-desc'><p>A ResultSet object which holds the data in JavaScript object form,\n  and any associated metadata that was present in the <code>rawData</code>.</p>\n</div></li></ul></div></div></div></div></div></div></div>"});