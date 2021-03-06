/*global define, window, jQuery, describe, beforeEach, afterEach, it, expect, spyOn */
define( [
	'data/Model',
	'data/persistence/proxy/Memory',
	'data/persistence/reader/Json',
	'data/persistence/request/Read'
], function( Model, MemoryProxy, JsonReader, ReadRequest ) {
    
	describe( 'data.persistence.proxy.Memory', function() {
		
		describe( 'read()', function() {
			
			it( "should throw an error if there is no `data` set on the MemoryProxy", function() {
				var proxy = new MemoryProxy( {
					// no `data`
				} );
				var request = new ReadRequest( { proxy: proxy } );
				
				expect( function() {
					proxy.read( request );
				} ).toThrow( "No `data` set on MemoryProxy" );
			} );
			
			
			it( "should immediately resolve the Request with the transformed raw data", function() {
				var proxy = new MemoryProxy( {
					data : '{ "a": 1, "b": 2, "c": 3 }',  // raw json
					
					reader : new JsonReader()
				} );
				
				var request = new ReadRequest( { proxy: proxy } ),
				    resolvedResultSet;
				
				request.done( function( resultSet ) { resolvedResultSet = resultSet; } );  // get the records from the ResultSet which the Request was resolved with
				proxy.read( request );
				
				var expectedData = [ { a: 1, b: 2, c: 3 } ];
				expect( resolvedResultSet.getRecords() ).toEqual( expectedData );
			} );
			
		} );
		
	} );
    
} );