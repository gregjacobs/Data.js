Ext.data.JsonP.data_persistence_request_Create({"tagname":"class","name":"data.persistence.request.Create","extends":"data.persistence.request.Write","mixins":[],"alternateClassNames":[],"aliases":{},"singleton":false,"requires":[],"uses":[],"enum":null,"override":null,"inheritable":null,"inheritdoc":null,"meta":{},"private":null,"id":"class-data.persistence.request.Create","members":{"cfg":[{"name":"models","tagname":"cfg","owner":"data.persistence.request.Write","meta":{},"id":"cfg-models"},{"name":"params","tagname":"cfg","owner":"data.persistence.request.Request","meta":{},"id":"cfg-params"},{"name":"proxy","tagname":"cfg","owner":"data.persistence.request.Request","meta":{},"id":"cfg-proxy"}],"property":[{"name":"error","tagname":"property","owner":"data.persistence.request.Request","meta":{"private":true},"id":"property-error"},{"name":"exception","tagname":"property","owner":"data.persistence.request.Request","meta":{"private":true},"id":"property-exception"},{"name":"resultSet","tagname":"property","owner":"data.persistence.request.Request","meta":{"protected":true},"id":"property-resultSet"},{"name":"success","tagname":"property","owner":"data.persistence.request.Request","meta":{"private":true},"id":"property-success"}],"method":[{"name":"constructor","tagname":"method","owner":"data.persistence.request.Request","meta":{},"id":"method-constructor"},{"name":"execute","tagname":"method","owner":"data.persistence.request.Request","meta":{},"id":"method-execute"},{"name":"getAction","tagname":"method","owner":"data.persistence.request.Create","meta":{"protected":true},"id":"method-getAction"},{"name":"getException","tagname":"method","owner":"data.persistence.request.Request","meta":{},"id":"method-getException"},{"name":"getModels","tagname":"method","owner":"data.persistence.request.Write","meta":{},"id":"method-getModels"},{"name":"getParams","tagname":"method","owner":"data.persistence.request.Request","meta":{},"id":"method-getParams"},{"name":"getResultSet","tagname":"method","owner":"data.persistence.request.Request","meta":{},"id":"method-getResultSet"},{"name":"hasErrored","tagname":"method","owner":"data.persistence.request.Request","meta":{},"id":"method-hasErrored"},{"name":"isComplete","tagname":"method","owner":"data.persistence.request.Request","meta":{},"id":"method-isComplete"},{"name":"setException","tagname":"method","owner":"data.persistence.request.Request","meta":{},"id":"method-setException"},{"name":"setProxy","tagname":"method","owner":"data.persistence.request.Request","meta":{},"id":"method-setProxy"},{"name":"setResultSet","tagname":"method","owner":"data.persistence.request.Request","meta":{},"id":"method-setResultSet"},{"name":"setSuccess","tagname":"method","owner":"data.persistence.request.Request","meta":{},"id":"method-setSuccess"},{"name":"wasSuccessful","tagname":"method","owner":"data.persistence.request.Request","meta":{},"id":"method-wasSuccessful"}],"event":[],"css_var":[],"css_mixin":[]},"linenr":6,"files":[{"filename":"Create.js","href":"Create.html#data-persistence-request-Create"}],"html_meta":{},"statics":{"cfg":[],"property":[],"method":[],"event":[],"css_var":[],"css_mixin":[]},"component":false,"superclasses":["data.persistence.request.Request","data.persistence.request.Write"],"subclasses":[],"mixedInto":[],"parentMixins":[],"html":"<div><pre class=\"hierarchy\"><h4>Hierarchy</h4><div class='subclass first-child'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='docClass'>data.persistence.request.Request</a><div class='subclass '><a href='#!/api/data.persistence.request.Write' rel='data.persistence.request.Write' class='docClass'>data.persistence.request.Write</a><div class='subclass '><strong>data.persistence.request.Create</strong></div></div></div><h4>Files</h4><div class='dependency'><a href='source/Create.html#data-persistence-request-Create' target='_blank'>Create.js</a></div></pre><div class='doc-contents'><p>Represents a \"create\" CRUD request to a persistent storage mechanism.</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-cfg'>Config options</h3><div class='subsection'><div id='cfg-models' class='member first-child inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Write' rel='data.persistence.request.Write' class='defined-in docClass'>data.persistence.request.Write</a><br/><a href='source/Write.html#data-persistence-request-Write-cfg-models' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Write-cfg-models' class='name not-expandable'>models</a><span> : <a href=\"#!/api/data.Model\" rel=\"data.Model\" class=\"docClass\">data.Model</a>[]</span></div><div class='description'><div class='short'><p>The models to write during the WriteRequest.</p>\n</div><div class='long'><p>The models to write during the WriteRequest.</p>\n</div></div></div><div id='cfg-params' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-cfg-params' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-cfg-params' class='name expandable'>params</a><span> : Object</span></div><div class='description'><div class='short'>A map of any parameters to pass along for the Request. ...</div><div class='long'><p>A map of any parameters to pass along for the Request. These parameters will be interpreted by the\nparticular <a href=\"#!/api/data.persistence.proxy.Proxy\" rel=\"data.persistence.proxy.Proxy\" class=\"docClass\">data.persistence.proxy.Proxy</a> that is being used. For example, the\n<a href=\"#!/api/data.persistence.proxy.Ajax\" rel=\"data.persistence.proxy.Ajax\" class=\"docClass\">Ajax</a> proxy appends them as URL parameters for the request.</p>\n\n<p>Example:</p>\n\n<pre><code>params : {\n    param1: \"value1\",\n    param2: \"value2\n}\n</code></pre>\n</div></div></div><div id='cfg-proxy' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-cfg-proxy' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-cfg-proxy' class='name expandable'>proxy</a><span> : <a href=\"#!/api/data.persistence.proxy.Proxy\" rel=\"data.persistence.proxy.Proxy\" class=\"docClass\">data.persistence.proxy.Proxy</a></span></div><div class='description'><div class='short'>The Proxy that the Request should be made to. ...</div><div class='long'><p>The Proxy that the Request should be made to. Running the <a href=\"#!/api/data.persistence.request.Request-method-execute\" rel=\"data.persistence.request.Request-method-execute\" class=\"docClass\">execute</a> method will make the\nrequest to this Proxy.</p>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-error' class='member first-child inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-property-error' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-property-error' class='name expandable'>error</a><span> : Boolean</span><strong class='private signature' >private</strong></div><div class='description'><div class='short'>Property which is set to true upon failure to complete the Request. ...</div><div class='long'><p>Property which is set to true upon failure to complete the Request. Read this value\nwith <a href=\"#!/api/data.persistence.request.Request-method-hasErrored\" rel=\"data.persistence.request.Request-method-hasErrored\" class=\"docClass\">hasErrored</a>.</p>\n<p>Defaults to: <code>false</code></p></div></div></div><div id='property-exception' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-property-exception' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-property-exception' class='name expandable'>exception</a><span> : String/Object</span><strong class='private signature' >private</strong></div><div class='description'><div class='short'>An object or string describing the exception that occurred. ...</div><div class='long'><p>An object or string describing the exception that occurred. Set when <a href=\"#!/api/data.persistence.request.Request-method-setException\" rel=\"data.persistence.request.Request-method-setException\" class=\"docClass\">setException</a>\nis called.</p>\n</div></div></div><div id='property-resultSet' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-property-resultSet' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-property-resultSet' class='name expandable'>resultSet</a><span> : <a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a></span><strong class='protected signature' >protected</strong></div><div class='description'><div class='short'>A ResultSet object which contains any data read by the Request. ...</div><div class='long'><p>A ResultSet object which contains any data read by the Request. This object contains any\nreturned data, as well as any metadata (such as the total number of records in a paged data set).\nThis object is set by a <a href=\"#!/api/data.persistence.proxy.Proxy\" rel=\"data.persistence.proxy.Proxy\" class=\"docClass\">data.persistence.proxy.Proxy</a> when it finishes its routine, and can be\nretrieved via <a href=\"#!/api/data.persistence.request.Request-method-getResultSet\" rel=\"data.persistence.request.Request-method-getResultSet\" class=\"docClass\">getResultSet</a>. Some notes:</p>\n\n<ul>\n<li>For cases of read requests, this object will contain the data that is read by the request.</li>\n<li>For cases of write requests, this object will contain any \"update\" data that is returned to the\nProxy when it completes its routine. For example, if a REST server returns the updated\nattributes of a model after it is saved (say, with some computed attributes, or a generated\nid attribute), then the ResultSet will contain that data.</li>\n</ul>\n\n</div></div></div><div id='property-success' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-property-success' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-property-success' class='name expandable'>success</a><span> : Boolean</span><strong class='private signature' >private</strong></div><div class='description'><div class='short'>Property which is set to true upon successful completion of the Request. ...</div><div class='long'><p>Property which is set to true upon successful completion of the Request. Read\nthis value with <a href=\"#!/api/data.persistence.request.Request-method-wasSuccessful\" rel=\"data.persistence.request.Request-method-wasSuccessful\" class=\"docClass\">wasSuccessful</a>.</p>\n<p>Defaults to: <code>false</code></p></div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/data.persistence.request.Request-method-constructor' class='name expandable'>data.persistence.request.Create</a>( <span class='pre'>[cfg]</span> ) : <a href=\"#!/api/data.persistence.request.Request\" rel=\"data.persistence.request.Request\" class=\"docClass\">data.persistence.request.Request</a></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>cfg</span> : Object (optional)<div class='sub-desc'><p>Any of the configuration options for this class, in an Object (map).</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/data.persistence.request.Request\" rel=\"data.persistence.request.Request\" class=\"docClass\">data.persistence.request.Request</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-execute' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-method-execute' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-method-execute' class='name expandable'>execute</a>( <span class='pre'></span> ) : jQuery.Promise</div><div class='description'><div class='short'>Executes the Request using the configured proxy. ...</div><div class='long'><p>Executes the Request using the configured <a href=\"#!/api/data.persistence.request.Request-cfg-proxy\" rel=\"data.persistence.request.Request-cfg-proxy\" class=\"docClass\">proxy</a>.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>jQuery.Promise</span><div class='sub-desc'><p>A Promise object which is resolved when the Request is complete.\n  <code>done</code>, <code>fail</code>, and <code>always</code> callbacks are called with this Request object provided\n  as the first argument.</p>\n</div></li></ul></div></div></div><div id='method-getAction' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.request.Create'>data.persistence.request.Create</span><br/><a href='source/Create.html#data-persistence-request-Create-method-getAction' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Create-method-getAction' class='name expandable'>getAction</a>( <span class='pre'></span> ) : String<strong class='protected signature' >protected</strong></div><div class='description'><div class='short'>Implementation of abstract method to return the Proxy\nCRUD action name for the Request. ...</div><div class='long'><p>Implementation of abstract method to return the <a href=\"#!/api/data.persistence.proxy.Proxy\" rel=\"data.persistence.proxy.Proxy\" class=\"docClass\">Proxy</a>\nCRUD action name for the Request.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>String</span><div class='sub-desc'><p>Always returns 'create' for the CreateRequest.</p>\n</div></li></ul><p>Overrides: <a href='#!/api/data.persistence.request.Request-method-getAction' rel='data.persistence.request.Request-method-getAction' class='docClass'>data.persistence.request.Request.getAction</a></p></div></div></div><div id='method-getException' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-method-getException' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-method-getException' class='name expandable'>getException</a>( <span class='pre'></span> ) : String/Object</div><div class='description'><div class='short'>Retrieves any exception object attached for an errored Request. ...</div><div class='long'><p>Retrieves any exception object attached for an errored Request.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>String/Object</span><div class='sub-desc'><p>The <a href=\"#!/api/data.persistence.request.Request-property-exception\" rel=\"data.persistence.request.Request-property-exception\" class=\"docClass\">exception</a> object or string which describes\n  the exception that occurred for an errored Request.</p>\n</div></li></ul></div></div></div><div id='method-getModels' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Write' rel='data.persistence.request.Write' class='defined-in docClass'>data.persistence.request.Write</a><br/><a href='source/Write.html#data-persistence-request-Write-method-getModels' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Write-method-getModels' class='name expandable'>getModels</a>( <span class='pre'></span> ) : <a href=\"#!/api/data.Model\" rel=\"data.Model\" class=\"docClass\">data.Model</a>[]</div><div class='description'><div class='short'>Retrieves the models provided for this WriteRequest. ...</div><div class='long'><p>Retrieves the <a href=\"#!/api/data.persistence.request.Write-cfg-models\" rel=\"data.persistence.request.Write-cfg-models\" class=\"docClass\">models</a> provided for this WriteRequest.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/data.Model\" rel=\"data.Model\" class=\"docClass\">data.Model</a>[]</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-getParams' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-method-getParams' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-method-getParams' class='name expandable'>getParams</a>( <span class='pre'></span> ) : Object</div><div class='description'><div class='short'>Retrieves the params for this Request. ...</div><div class='long'><p>Retrieves the <a href=\"#!/api/data.persistence.request.Request-cfg-params\" rel=\"data.persistence.request.Request-cfg-params\" class=\"docClass\">params</a> for this Request. Returns an empty\nobject if no params were provided.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>Object</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-getResultSet' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-method-getResultSet' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-method-getResultSet' class='name expandable'>getResultSet</a>( <span class='pre'></span> ) : <a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a></div><div class='description'><div class='short'>Retrieves the data.persistence.ResultSet containing any data and metadata read by the\nRequest. ...</div><div class='long'><p>Retrieves the <a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a> containing any data and metadata read by the\nRequest. This is set by a <a href=\"#!/api/data.persistence.proxy.Proxy\" rel=\"data.persistence.proxy.Proxy\" class=\"docClass\">data.persistence.proxy.Proxy</a> when it finishes its routine.</p>\n\n<ul>\n<li>For cases of read requests, this object will contain the data that is read by the request.</li>\n<li>For cases of write requests, this object will contain any \"update\" data that is returned to the\nProxy when it completes its routine. For example, if a REST server returns the updated\nattributes of a model after it is saved (say, with some computed attributes, or a generated\nid attribute), then the ResultSet will contain that data.</li>\n</ul>\n\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a></span><div class='sub-desc'><p>The ResultSet read by the Proxy, or null if one has not been set.</p>\n</div></li></ul></div></div></div><div id='method-hasErrored' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-method-hasErrored' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-method-hasErrored' class='name expandable'>hasErrored</a>( <span class='pre'></span> ) : Boolean</div><div class='description'><div class='short'>Determines if the Request failed to complete successfully. ...</div><div class='long'><p>Determines if the Request failed to complete successfully.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>Boolean</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-isComplete' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-method-isComplete' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-method-isComplete' class='name expandable'>isComplete</a>( <span class='pre'></span> ) : Boolean</div><div class='description'><div class='short'>Determines if the Request is complete. ...</div><div class='long'><p>Determines if the Request is complete.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>Boolean</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-setException' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-method-setException' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-method-setException' class='name expandable'>setException</a>( <span class='pre'>exception</span> )</div><div class='description'><div class='short'>Marks the Request as having errored, and sets an exception object that describes the exception\nthat has occurred. ...</div><div class='long'><p>Marks the Request as having errored, and sets an exception object that describes the exception\nthat has occurred.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>exception</span> : String/Object<div class='sub-desc'><p>An object or string describing the exception that occurred.</p>\n</div></li></ul></div></div></div><div id='method-setProxy' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-method-setProxy' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-method-setProxy' class='name expandable'>setProxy</a>( <span class='pre'>proxy</span> )</div><div class='description'><div class='short'>Sets the proxy that this Request will use when executed. ...</div><div class='long'><p>Sets the <a href=\"#!/api/data.persistence.request.Request-cfg-proxy\" rel=\"data.persistence.request.Request-cfg-proxy\" class=\"docClass\">proxy</a> that this Request will use when <a href=\"#!/api/data.persistence.request.Request-method-execute\" rel=\"data.persistence.request.Request-method-execute\" class=\"docClass\">executed</a>.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>proxy</span> : <a href=\"#!/api/data.persistence.proxy.Proxy\" rel=\"data.persistence.proxy.Proxy\" class=\"docClass\">data.persistence.proxy.Proxy</a><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-setResultSet' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-method-setResultSet' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-method-setResultSet' class='name expandable'>setResultSet</a>( <span class='pre'>resultSet</span> )</div><div class='description'><div class='short'>Accessor for a Proxy to set a ResultSet which contains the data that is has read,\nonce the request completes. ...</div><div class='long'><p>Accessor for a Proxy to set a ResultSet which contains the data that is has read,\nonce the request completes.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>resultSet</span> : <a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a><div class='sub-desc'><p>A ResultSet which contains the data and any metadata read by\n  the Proxy.</p>\n</div></li></ul></div></div></div><div id='method-setSuccess' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-method-setSuccess' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-method-setSuccess' class='name expandable'>setSuccess</a>( <span class='pre'></span> )</div><div class='description'><div class='short'>Marks the Request as successful. ...</div><div class='long'><p>Marks the Request as successful.</p>\n</div></div></div><div id='method-wasSuccessful' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/data.persistence.request.Request' rel='data.persistence.request.Request' class='defined-in docClass'>data.persistence.request.Request</a><br/><a href='source/Request.html#data-persistence-request-Request-method-wasSuccessful' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.request.Request-method-wasSuccessful' class='name expandable'>wasSuccessful</a>( <span class='pre'></span> ) : Boolean</div><div class='description'><div class='short'>Determines if the Request completed successfully. ...</div><div class='long'><p>Determines if the Request completed successfully.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>Boolean</span><div class='sub-desc'>\n</div></li></ul></div></div></div></div></div></div></div>"});