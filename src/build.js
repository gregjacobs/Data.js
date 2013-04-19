(function() {
	
	var files = [
		'data/Collection',
		'data/Data',
		'data/DataComponent',
		'data/Model',
		'data/ModelCache',
		'data/NativeObjectConverter',
		'data/attribute/Attribute',
		'data/attribute/Boolean',
		'data/attribute/Collection',
		'data/attribute/DataComponent',
		'data/attribute/Date',
		'data/attribute/Float',
		'data/attribute/Integer',
		'data/attribute/Mixed',
		'data/attribute/Model',
		'data/attribute/Number',
		'data/attribute/Object',
		'data/attribute/Primitive',
		'data/attribute/String',
		'data/persistence/operation/Batch',
		'data/persistence/operation/Operation',
		'data/persistence/operation/Read',
		'data/persistence/operation/Write',
		'data/persistence/proxy/Ajax',
		'data/persistence/proxy/Proxy',
		'data/persistence/proxy/Rest',
		'data/persistence/reader/Json',
		'data/persistence/reader/Reader',
		'data/persistence/ResultSet'
	];
	
	return {
		baseUrl: '.',
		out: '../dist/data-all.js',
		
		paths : {
			'jquery' : 'empty:',
			'lodash' : 'empty:',
			'Class'  : 'empty:',
			'Observable' : 'empty:',
			'data'   : './'
		},
		
		logLevel: 2,  // 0=trace, 1=info, 2=warn, 3=error, 4=silent
		optimize: 'none',
		
		include : files,       // include all files, and
		insertRequire : files  // insert a require() statement at the end of the build file to get all of them
		                       // to execute and initialize, so that classes can be instantiated lazily by their `type`
		                       // (such as for attributes, and proxy types)
	};
	
}())