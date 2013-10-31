/*global define, window, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/Model',
	'data/persistence/proxy/Memory',
	'data/persistence/reader/Json'
], function( Model, MemoryProxy, JsonReader ) {

	describe( "Integration: Model with persistence.proxy.Memory", function() {
		
		it( "should load raw JSON text into a Model via its JsonReader", function() {
			var rawJson = '{ "a": 1, "b": 2, "c": 3 }';
			
			var proxy = new MemoryProxy( {
				data : rawJson,
				reader : new JsonReader()
			} );
			
			var MyModel = Model.extend( {
				attributes : [ 'a', 'b', 'c' ],
				proxy : proxy
			} );
			
			var myModel = new MyModel();
			myModel.load();  // loads data from the Model's proxy

			expect( myModel.get( 'a' ) ).toBe( 1 );
			expect( myModel.get( 'b' ) ).toBe( 2 );
		} );
		
	} );
	
	
} );
		