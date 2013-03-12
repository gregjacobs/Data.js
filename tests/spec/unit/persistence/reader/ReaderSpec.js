/*global define, describe, beforeEach, it, expect */
define( [
	'Class',
	'data/persistence/reader/Reader'
], function( Class, Reader ) {
	
	describe( 'Data.persistence.reader.Reader', function() {
		var ConcreteReader = Class.extend( Reader, {
			convertRaw : function( rawData ) { return rawData; }  // simply returns data provided to it
		} );
		
		
		
		
		describe( 'extractRecords()', function() {
			
		} );
		
		
		
		describe( 'extractTotalCount()', function() {
			
		} );
		
		
		describe( 'extractMessage()', function() {
			
		} );

		
		describe( 'processRecords()', function() {
			
			it( "should call processRecord() for each record", function() {
				var processRecordObjs = [];
				
				var MyReader = Class.extend( ConcreteReader, {
					processRecord : function( obj ) {
						
					}
				} );
				
				var reader = new ConcreteReader(),
				    records = [ { a: 1 }, { a: 2 } ];
				
				
				
			} );
			
		} );
		
		
		
		describe( 'processRecord()', function() {
			
			it( "should simply return the argument provided to it", function() {
				var reader = new ConcreteReader(),
				    dataObj = {};
				
				expect( reader.processRecord( dataObj ) ).toBe( dataObj );
			} );
			
		} );
		
		
		
		describe( 'findPropertyValue()', function() {
			var obj = {
				a: 1,
				b: 2,
				c: {
					d: 3,
					e: 4,
					f: {
						g: 5
					}
				}
			};
			
			var reader;
			beforeEach( function() {
				reader = new ConcreteReader();
			} );
			
			
			it( "should return undefined if either argument is not provided", function() {
				expect( reader.findPropertyValue( undefined, undefined ) ).toBeUndefined();
				expect( reader.findPropertyValue( obj, undefined ) ).toBeUndefined();
				expect( reader.findPropertyValue( undefined, 'a' ) ).toBeUndefined();
			} );
			
			
			it( "should return the values of named properties from the object", function() {
				expect( reader.findPropertyValue( obj, 'a' ) ).toBe( 1 );
				expect( reader.findPropertyValue( obj, 'b' ) ).toBe( 2 );
			} );
			
			
			it( "should return the values of nested properties from the object", function() {
				expect( reader.findPropertyValue( obj, 'c.d' ) ).toBe( 3 );
				expect( reader.findPropertyValue( obj, 'c.f.g' ) ).toBe( 5 );
			} );
			
			
			it( "should return undefined for properties not found in the object", function() {
				expect( reader.findPropertyValue( obj, 'x' ) ).toBeUndefined();
				expect( reader.findPropertyValue( obj, 'y.z' ) ).toBeUndefined();
				expect( reader.findPropertyValue( obj, 'c.f.g.zzz' ) ).toBeUndefined();
			} );
			
		} );
		
	} );
	
} );