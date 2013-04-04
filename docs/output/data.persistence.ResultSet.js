Ext.data.JsonP.data_persistence_ResultSet({"tagname":"class","name":"data.persistence.ResultSet","extends":null,"mixins":[],"alternateClassNames":[],"aliases":{},"singleton":false,"requires":[],"uses":[],"enum":null,"override":null,"inheritable":null,"inheritdoc":null,"meta":{"abstract":true},"private":null,"id":"class-data.persistence.ResultSet","members":{"cfg":[{"name":"message","tagname":"cfg","owner":"data.persistence.ResultSet","meta":{},"id":"cfg-message"},{"name":"records","tagname":"cfg","owner":"data.persistence.ResultSet","meta":{},"id":"cfg-records"},{"name":"totalCount","tagname":"cfg","owner":"data.persistence.ResultSet","meta":{},"id":"cfg-totalCount"}],"property":[],"method":[{"name":"constructor","tagname":"method","owner":"data.persistence.ResultSet","meta":{},"id":"method-constructor"},{"name":"getMessage","tagname":"method","owner":"data.persistence.ResultSet","meta":{},"id":"method-getMessage"},{"name":"getRecords","tagname":"method","owner":"data.persistence.ResultSet","meta":{},"id":"method-getRecords"},{"name":"getTotalCount","tagname":"method","owner":"data.persistence.ResultSet","meta":{},"id":"method-getTotalCount"}],"event":[],"css_var":[],"css_mixin":[]},"linenr":7,"files":[{"filename":"ResultSet.js","href":"ResultSet.html#data-persistence-ResultSet"}],"html_meta":{"abstract":null},"statics":{"cfg":[],"property":[],"method":[],"event":[],"css_var":[],"css_mixin":[]},"component":false,"superclasses":[],"subclasses":[],"mixedInto":[],"parentMixins":[],"html":"<div><pre class=\"hierarchy\"><h4>Files</h4><div class='dependency'><a href='source/ResultSet.html#data-persistence-ResultSet' target='_blank'>ResultSet.js</a></div></pre><div class='doc-contents'><p>Simple wrapper which holds the data returned by any <a href=\"#!/api/data.persistence.proxy.Proxy\" rel=\"data.persistence.proxy.Proxy\" class=\"docClass\">Proxy</a>\noperation, along with any metadata such as the total number of data records in a windowed\ndata set.</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-cfg'>Config options</h3><div class='subsection'><div id='cfg-message' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.ResultSet'>data.persistence.ResultSet</span><br/><a href='source/ResultSet.html#data-persistence-ResultSet-cfg-message' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.ResultSet-cfg-message' class='name expandable'>message</a><span> : String</span></div><div class='description'><div class='short'>Any message metadata for the ResultSet. ...</div><div class='long'><p>Any message metadata for the ResultSet.</p>\n<p>Defaults to: <code>&quot;&quot;</code></p></div></div></div><div id='cfg-records' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.ResultSet'>data.persistence.ResultSet</span><br/><a href='source/ResultSet.html#data-persistence-ResultSet-cfg-records' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.ResultSet-cfg-records' class='name expandable'>records</a><span> : Object/Object[]</span></div><div class='description'><div class='short'>One or more data records that have been returned by a Proxy,\nafter they have been converted to plain JavaScript objec...</div><div class='long'><p>One or more data records that have been returned by a <a href=\"#!/api/data.persistence.proxy.Proxy\" rel=\"data.persistence.proxy.Proxy\" class=\"docClass\">Proxy</a>,\nafter they have been converted to plain JavaScript objects by a\n<a href=\"#!/api/data.persistence.reader.Reader\" rel=\"data.persistence.reader.Reader\" class=\"docClass\">Reader</a>.</p>\n</div></div></div><div id='cfg-totalCount' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.ResultSet'>data.persistence.ResultSet</span><br/><a href='source/ResultSet.html#data-persistence-ResultSet-cfg-totalCount' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.ResultSet-cfg-totalCount' class='name expandable'>totalCount</a><span> : Number</span></div><div class='description'><div class='short'>Metadata for the total number of records in the data set. ...</div><div class='long'><p>Metadata for the total number of records in the data set. This is used for windowed (paged)\ndata sets, and will be the total number of records available on the storage medium (ex: a\nserver database).</p>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.ResultSet'>data.persistence.ResultSet</span><br/><a href='source/ResultSet.html#data-persistence-ResultSet-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/data.persistence.ResultSet-method-constructor' class='name expandable'>data.persistence.ResultSet</a>( <span class='pre'>config</span> ) : <a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>config</span> : Object<div class='sub-desc'><p>The configuration options for this class, specified in an Object (map).</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/data.persistence.ResultSet\" rel=\"data.persistence.ResultSet\" class=\"docClass\">data.persistence.ResultSet</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-getMessage' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.ResultSet'>data.persistence.ResultSet</span><br/><a href='source/ResultSet.html#data-persistence-ResultSet-method-getMessage' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.ResultSet-method-getMessage' class='name expandable'>getMessage</a>( <span class='pre'></span> ) : String</div><div class='description'><div class='short'>Retrieves the message, if there is any. ...</div><div class='long'><p>Retrieves the <a href=\"#!/api/data.persistence.ResultSet-cfg-message\" rel=\"data.persistence.ResultSet-cfg-message\" class=\"docClass\">message</a>, if there is any.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>String</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-getRecords' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.ResultSet'>data.persistence.ResultSet</span><br/><a href='source/ResultSet.html#data-persistence-ResultSet-method-getRecords' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.ResultSet-method-getRecords' class='name expandable'>getRecords</a>( <span class='pre'></span> ) : Object[]</div><div class='description'><div class='short'>Retrieves the records in this ResultSet. ...</div><div class='long'><p>Retrieves the <a href=\"#!/api/data.persistence.ResultSet-cfg-records\" rel=\"data.persistence.ResultSet-cfg-records\" class=\"docClass\">records</a> in this ResultSet.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>Object[]</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-getTotalCount' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='data.persistence.ResultSet'>data.persistence.ResultSet</span><br/><a href='source/ResultSet.html#data-persistence-ResultSet-method-getTotalCount' target='_blank' class='view-source'>view source</a></div><a href='#!/api/data.persistence.ResultSet-method-getTotalCount' class='name expandable'>getTotalCount</a>( <span class='pre'></span> ) : Number</div><div class='description'><div class='short'>Retrieves the totalCount, which is the total number of records in a windowed (paged)\ndata set. ...</div><div class='long'><p>Retrieves the <a href=\"#!/api/data.persistence.ResultSet-cfg-totalCount\" rel=\"data.persistence.ResultSet-cfg-totalCount\" class=\"docClass\">totalCount</a>, which is the total number of records in a windowed (paged)\ndata set. If the <a href=\"#!/api/data.persistence.ResultSet-cfg-totalCount\" rel=\"data.persistence.ResultSet-cfg-totalCount\" class=\"docClass\">totalCount</a> config was not provided, this method will return <code>undefined</code>.</p>\n\n<p>To find the number of records in this particular ResultSet, use <a href=\"#!/api/data.persistence.ResultSet-method-getRecords\" rel=\"data.persistence.ResultSet-method-getRecords\" class=\"docClass\">getRecords</a> method\nand check the <code>length</code> property.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>Number</span><div class='sub-desc'><p>The total count read by a <a href=\"#!/api/data.persistence.reader.Reader\" rel=\"data.persistence.reader.Reader\" class=\"docClass\">Reader</a>, or\n  <code>undefined</code> if no such value was read.</p>\n</div></li></ul></div></div></div></div></div></div></div>"});