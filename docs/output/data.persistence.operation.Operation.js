Ext.data.JsonP.data_persistence_operation_Operation({"tagname":"class","name":"data.persistence.operation.Operation","extends":null,"mixins":[],"alternateClassNames":[],"aliases":{},"singleton":false,"requires":[],"uses":[],"enum":null,"override":null,"inheritable":null,"inheritdoc":null,"meta":{"abstract":true},"private":null,"id":"class-data.persistence.operation.Operation","members":{"cfg":[{"name":"params","tagname":"cfg","owner":"data.persistence.operation.Operation","meta":{},"id":"cfg-params"}],"property":[{"name":"error","tagname":"property","owner":"data.persistence.operation.Operation","meta":{"private":true},"id":"property-error"},{"name":"exception","tagname":"property","owner":"data.persistence.operation.Operation","meta":{"private":true},"id":"property-exception"},{"name":"resultSet","tagname":"property","owner":"data.persistence.operation.Operation","meta":{"protected":true},"id":"property-resultSet"},{"name":"success","tagname":"property","owner":"data.persistence.operation.Operation","meta":{"private":true},"id":"property-success"}],"method":[{"name":"constructor","tagname":"method","owner":"data.persistence.operation.Operation","meta":{},"id":"method-constructor"},{"name":"getException","tagname":"method","owner":"data.persistence.operation.Operation","meta":{},"id":"method-getException"},{"name":"getParams","tagname":"method","owner":"data.persistence.operation.Operation","meta":{},"id":"method-getParams"},{"name":"getResultSet","tagname":"method","owner":"data.persistence.operation.Operation","meta":{},"id":"method-getResultSet"},{"name":"hasErrored","tagname":"method","owner":"data.persistence.operation.Operation","meta":{},"id":"method-hasErrored"},{"name":"isComplete","tagname":"method","owner":"data.persistence.operation.Operation","meta":{},"id":"method-isComplete"},{"name":"setException","tagname":"method","owner":"data.persistence.operation.Operation","meta":{},"id":"method-setException"},{"name":"setResultSet","tagname":"method","owner":"data.persistence.operation.Operation","meta":{},"id":"method-setResultSet"},{"name":"setSuccess","tagname":"method","owner":"data.persistence.operation.Operation","meta":{},"id":"method-setSuccess"},{"name":"wasSuccessful","tagname":"method","owner":"data.persistence.operation.Operation","meta":{},"id":"method-wasSuccessful"}],"event":[],"css_var":[],"css_mixin":[]},"linenr":7,"files":[{"filename":"Operation.js","href":"Operation.html#data-persistence-operation-Operation"}],"html_meta":{"abstract":null},"statics":{"cfg":[],"property":[],"method":[],"event":[],"css_var":[],"css_mixin":[]},"component":false,"superclasses":[],"subclasses":["data.persistence.operation.Read","data.persistence.operation.Write"],"mixedInto":[],"parentMixins":[],"html":"<div><pre class=\"hierarchy\"><h4>Subclasses</h4><div class='dependency'><a href='#!/api/data.persistence.operation.Read' rel='data.persistence.operation.Read' class='docClass'>data.persistence.operation.Read</a></div><div class='dependency'><a href='#!/api/data.persistence.operation.Write' rel='data.persistence.operation.Write' class='docClass'>data.persistence.operation.Write</a></div><h4>Files</h4><div class='dependency'><a href='source/Operation.html#data-persistence-operation-Operation' target='_blank'>Operation.js</a></div></pre><div class='doc-contents'><p>Represents an operation for a <a href=\"#!/api/data.persistence.proxy.Proxy\" rel=\"data.persistence.proxy.Proxy\" class=\"docClass\">data.persistence.proxy.Proxy</a> to carry out. This class basically represents\nany CRUD operation to be performed, passes along any options needed for that operation, and accepts any data/state\nas a result of that operation.</p>\n\n<p>Operation's subclasses are split into two distinct implementations:</p>\n\n<ul>\n<li><a href=\"#!/api/data.persistence.operation.Read\" rel=\"data.persistence.operation.Read\" class=\"docClass\">data.persistence.operation.Read</a>: Represents an Operation to read (load) data from persistence storage.</li>\n<li><a href=\"#!/api/data.persistence.operation.Write\" rel=\"data.persistence.operation.Write\" class=\"docClass\">data.persistence.operation.Write</a>: Represents an Operation to write (store) data to persistence storage.\nThis includes destroying (deleting) models as well.</li>\n</ul>\n\n\n<p>This class is used internally by the framework when making requests to <a href=\"#!/api/data.persistence.proxy.Proxy\" rel=\"data.persistence.proxy.Proxy\" class=\"docClass\">Proxies</a>,\nbut is provided to client callbacks for when <a href=\"#!/api/data.Model\" rel=\"data.Model\" class=\"docClass\">Model</a>/<a href=\"#!/api/data.Collection\" rel=\"data.Collection\" class=\"docClass\">Collection</a> operations\ncomplete, so information can be obtained about the operation that took place.</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-cfg'>Config options</h3><div class='subsection'><div id='cfg-params' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-cfg-params' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-cfg-params' class='name expandable'>params</a><span> : Object</span></div><div class='description'><div class='short'>A map of any parameters to pass along for the Operation. ...</div><div class='long'><p>A map of any parameters to pass along for the Operation. These parameters will be interpreted by the\nparticular <a href=\"#!/api/data.persistence.proxy.Proxy\" rel=\"data.persistence.proxy.Proxy\" class=\"docClass\">data.persistence.proxy.Proxy</a> that is being used. For example, the\n<a href=\"#!/api/data.persistence.proxy.Ajax\" rel=\"data.persistence.proxy.Ajax\" class=\"docClass\">Ajax</a> proxy appends them as URL parameters for the request.</p>\n\n<p>Example:</p>\n\n<pre><code>params : {\n    param1: \"value1\",\n    param2: \"value2\n}\n</code></pre>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-error' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-property-error' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-property-error' class='name expandable'>error</a><span> : Boolean</span><strong class='private signature' >private</strong></div><div class='description'><div class='short'>Property which is set to true upon failure to complete the Operation. ...</div><div class='long'><p>Property which is set to true upon failure to complete the Operation. Read this value\nwith <a href=\"#!/api/data.persistence.operation.Operation-method-hasErrored\" rel=\"data.persistence.operation.Operation-method-hasErrored\" class=\"docClass\">hasErrored</a>.</p>\n<p>Defaults to: <code>false</code></p></div></div></div><div id='property-exception' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-property-exception' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-property-exception' class='name expandable'>exception</a><span> : String/Object</span><strong class='private signature' >private</strong></div><div class='description'><div class='short'>An object or string describing the exception that occurred. ...</div><div class='long'><p>An object or string describing the exception that occurred. Set when <a href=\"#!/api/data.persistence.operation.Operation-method-setException\" rel=\"data.persistence.operation.Operation-method-setException\" class=\"docClass\">setException</a>\nis called.</p>\n</div></div></div><div id='property-resultSet' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-property-resultSet' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-property-resultSet' class='name expandable'>resultSet</a><span> : <a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a></span><strong class='protected signature' >protected</strong></div><div class='description'><div class='short'>A ResultSet object which contains any data read by the Operation. ...</div><div class='long'><p>A ResultSet object which contains any data read by the Operation. This object contains any\nreturned data, as well as any metadata (such as the total number of records in a paged data set).\nThis object is set by a <a href=\"#!/api/data.persistence.proxy.Proxy\" rel=\"data.persistence.proxy.Proxy\" class=\"docClass\">data.persistence.proxy.Proxy</a> when it finishes its routine, and can be\nretrieved via <a href=\"#!/api/data.persistence.operation.Operation-method-getResultSet\" rel=\"data.persistence.operation.Operation-method-getResultSet\" class=\"docClass\">getResultSet</a>. Some notes:</p>\n\n<ul>\n<li>For cases of read operations, this object will contain the data that is read by the operation.</li>\n<li>For cases of write operations, this object will contain any \"update\" data that is returned to the\nProxy when it completes its routine. For example, if a REST server returns the updated\nattributes of a model after it is saved (say, with some computed attributes, or a generated\nid attribute), then the ResultSet will contain that data.</li>\n</ul>\n\n</div></div></div><div id='property-success' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-property-success' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-property-success' class='name expandable'>success</a><span> : Boolean</span><strong class='private signature' >private</strong></div><div class='description'><div class='short'>Property which is set to true upon successful completion of the Operation. ...</div><div class='long'><p>Property which is set to true upon successful completion of the Operation. Read\nthis value with <a href=\"#!/api/data.persistence.operation.Operation-method-wasSuccessful\" rel=\"data.persistence.operation.Operation-method-wasSuccessful\" class=\"docClass\">wasSuccessful</a>.</p>\n<p>Defaults to: <code>false</code></p></div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/data.persistence.operation.Operation-method-constructor' class='name expandable'>data.persistence.operation.Operation</a>( <span class='pre'>[cfg]</span> ) : <a href=\"#!/api/data.persistence.operation.Operation\" rel=\"data.persistence.operation.Operation\" class=\"docClass\">data.persistence.operation.Operation</a></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>cfg</span> : Object (optional)<div class='sub-desc'><p>Any of the configuration options for this class, in an Object (map).</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/data.persistence.operation.Operation\" rel=\"data.persistence.operation.Operation\" class=\"docClass\">data.persistence.operation.Operation</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-getException' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-method-getException' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-method-getException' class='name expandable'>getException</a>( <span class='pre'></span> ) : String/Object</div><div class='description'><div class='short'>Retrieves any exception object attached for an errored Operation. ...</div><div class='long'><p>Retrieves any exception object attached for an errored Operation.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>String/Object</span><div class='sub-desc'><p>The <a href=\"#!/api/data.persistence.operation.Operation-property-exception\" rel=\"data.persistence.operation.Operation-property-exception\" class=\"docClass\">exception</a> object or string which describes\n  the exception that occurred for an errored Operation.</p>\n</div></li></ul></div></div></div><div id='method-getParams' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-method-getParams' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-method-getParams' class='name expandable'>getParams</a>( <span class='pre'></span> ) : Object</div><div class='description'><div class='short'>Retrieves the params for this Operation. ...</div><div class='long'><p>Retrieves the <a href=\"#!/api/data.persistence.operation.Operation-cfg-params\" rel=\"data.persistence.operation.Operation-cfg-params\" class=\"docClass\">params</a> for this Operation. Returns an empty\nobject if no params were provided.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>Object</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-getResultSet' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-method-getResultSet' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-method-getResultSet' class='name expandable'>getResultSet</a>( <span class='pre'></span> ) : <a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a></div><div class='description'><div class='short'>Retrieves the data.persistence.ResultSet containing any data and metadata read by the\nOperation. ...</div><div class='long'><p>Retrieves the <a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a> containing any data and metadata read by the\nOperation. This is set by a <a href=\"#!/api/data.persistence.proxy.Proxy\" rel=\"data.persistence.proxy.Proxy\" class=\"docClass\">data.persistence.proxy.Proxy</a> when it finishes its routine.</p>\n\n<ul>\n<li>For cases of read operations, this object will contain the data that is read by the operation.</li>\n<li>For cases of write operations, this object will contain any \"update\" data that is returned to the\nProxy when it completes its routine. For example, if a REST server returns the updated\nattributes of a model after it is saved (say, with some computed attributes, or a generated\nid attribute), then the ResultSet will contain that data.</li>\n</ul>\n\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a></span><div class='sub-desc'><p>The ResultSet read by the Proxy, or null if one has not been set.</p>\n</div></li></ul></div></div></div><div id='method-hasErrored' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-method-hasErrored' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-method-hasErrored' class='name expandable'>hasErrored</a>( <span class='pre'></span> ) : Boolean</div><div class='description'><div class='short'>Determines if the Operation failed to complete successfully. ...</div><div class='long'><p>Determines if the Operation failed to complete successfully.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>Boolean</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-isComplete' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-method-isComplete' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-method-isComplete' class='name expandable'>isComplete</a>( <span class='pre'></span> ) : Boolean</div><div class='description'><div class='short'>Determines if the Operation is complete. ...</div><div class='long'><p>Determines if the Operation is complete.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>Boolean</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-setException' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-method-setException' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-method-setException' class='name expandable'>setException</a>( <span class='pre'>exception</span> )</div><div class='description'><div class='short'>Marks the Operation as having errored, and sets an exception object that describes the exception\nthat has occurred. ...</div><div class='long'><p>Marks the Operation as having errored, and sets an exception object that describes the exception\nthat has occurred.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>exception</span> : String/Object<div class='sub-desc'><p>An object or string describing the exception that occurred.</p>\n</div></li></ul></div></div></div><div id='method-setResultSet' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-method-setResultSet' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-method-setResultSet' class='name expandable'>setResultSet</a>( <span class='pre'>A</span> )</div><div class='description'><div class='short'>Accessor for a Proxy to set a ResultSet which contains the data that is has read,\nonce the operation completes. ...</div><div class='long'><p>Accessor for a Proxy to set a ResultSet which contains the data that is has read,\nonce the operation completes.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>A</span> : <a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a><div class='sub-desc'><p>ResultSet which contains the data and any metadata read by\n  the Proxy.</p>\n</div></li></ul></div></div></div><div id='method-setSuccess' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-method-setSuccess' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-method-setSuccess' class='name expandable'>setSuccess</a>( <span class='pre'></span> )</div><div class='description'><div class='short'>Marks the Operation as successful. ...</div><div class='long'><p>Marks the Operation as successful.</p>\n</div></div></div><div id='method-wasSuccessful' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.operation.Operation'>data.persistence.operation.Operation</span><br/><a href='source/Operation.html#data-persistence-operation-Operation-method-wasSuccessful' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.operation.Operation-method-wasSuccessful' class='name expandable'>wasSuccessful</a>( <span class='pre'></span> ) : Boolean</div><div class='description'><div class='short'>Determines if the Operation completed successfully. ...</div><div class='long'><p>Determines if the Operation completed successfully.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>Boolean</span><div class='sub-desc'>\n</div></li></ul></div></div></div></div></div></div></div>"});