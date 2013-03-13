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
			var obj1 = { a: 1 },
			    obj2 = { a: 2 };
			
			it( "should extract the records from the root level object when no `dataProperty` config is specified", function() {
				var reader = new ConcreteReader();
				
				var records = reader.extractRecords( [ obj1, obj2 ] );
				expect( records ).toEqual( [ obj1, obj2 ] );
			} );
			
			
			it( "should extract the records from the property specified by the `dataProperty` config", function() {
				var reader = new ConcreteReader( {
					dataProperty: 'data'
				} );
				
				var records = reader.extractRecords( {
					data: [ obj1, obj2 ] 
				} );
				expect( records ).toEqual( [ obj1, obj2 ] );
			} );
			
			
			it( "should extract the records from the property specified by the `dataProperty` config, when the dataProperty config is a dot-delimited path to the property", function() {
				var reader = new ConcreteReader( {
					dataProperty: 'foo.bar'
				} );
				
				var records = reader.extractRecords( {
					foo: {
						bar: [ obj1, obj2 ]
					}
				} );
				expect( records ).toEqual( [ obj1, obj2 ] );
			} );
			
			
			it( "should convert a single data object into a one-element array, when using the object provided as the data", function() {
				var reader = new ConcreteReader();
				
				var records = reader.extractRecords( obj1 );
				expect( records ).toEqual( [ obj1 ] );
			} );
			
			
			it( "should convert a single data object into a one-element array, when using a nested property as the data", function() {
				var reader = new ConcreteReader( {
					dataProperty: 'data'
				} );
				
				var records = reader.extractRecords( {
					data: obj1
				} );
				expect( records ).toEqual( [ obj1 ] );
			} );
			
		} );
		
		
		
		describe( 'extractTotalCount()', function() {
			var obj1 = { a: 1 },
			    obj2 = { a: 2 };
			
			it( "should return undefined if there is no `totalProperty` config provided", function() {
				var reader = new ConcreteReader( {
					//totalProperty: 'total'  -- no totalProperty config provided
				} );
				
				var totalCount = reader.extractTotalCount( {
					data : [ obj1, obj2 ]
				} );
				expect( totalCount ).toBeUndefined();
			} );
			
			
			it( "should extract the total count from the property specified by the `totalProperty` config", function() {
				var reader = new ConcreteReader( {
					totalProperty: 'total'
				} );
				
				var totalCount = reader.extractTotalCount( {
					data : [ obj1, obj2 ],
					total : 2
				} );
				expect( totalCount ).toBe( 2 );
			} );
			
			
			it( "should throw an error if the property specified by the `totalProperty` config is not found in the data", function() {
				var reader = new ConcreteReader( {
					totalProperty: 'total'
				} );
				
				expect( function() {
					reader.extractTotalCount( {
						data : [ obj1, obj2 ]
						//total : 2  -- NOTE: no `total` property in the data
					} );
				} ).toThrow( "Reader could not find the total count property 'total' in the data." );
			} );
		} );
		
		
		
		describe( 'extractMessage()', function() {
			var obj1 = { a: 1 },
			    obj2 = { a: 2 };
			
			it( "should return undefined if there is no `messageProperty` config provided", function() {
				var reader = new ConcreteReader( {
					//messageProperty: 'message'  -- no messageProperty config provided
				} );
				
				var message = reader.extractMessage( {
					data : [ obj1, obj2 ]
				} );
				expect( message ).toBeUndefined();
			} );
			
			
			it( "should extract the message from the property specified by the `messageProperty` config", function() {
				var reader = new ConcreteReader( {
					messageProperty: 'message'
				} );
				
				var message = reader.extractMessage( {
					data : [ obj1, obj2 ],
					message : "Test Message"
				} );
				expect( message ).toBe( "Test Message" );
			} );
			
			
			it( "should throw an error if the property specified by the `messageProperty` config is not found in the data", function() {
				var reader = new ConcreteReader( {
					messageProperty: 'message'
				} );
				
				expect( function() {
					reader.extractMessage( {
						data : [ obj1, obj2 ]
						//message : "Test Message"  -- NOTE: no `message` property in the data
					} );
				} ).toThrow( "Reader could not find the message property 'message' in the data." );
			} );
		} );

		
		
		describe( 'processRecords()', function() {
			
			it( "should call processRecord() for each record", function() {
				var processedRecordObjs = [];
				
				var MyReader = Class.extend( ConcreteReader, {
					processRecord : function( obj ) {
						processedRecordObjs.push( obj );
						return obj;
					}
				} );
				
				var reader = new MyReader(),
				    obj1 = { a: 1 },
				    obj2 = { a: 2 },
				    records = [ obj1, obj2 ];
				
				reader.processRecords( records );
				expect( processedRecordObjs ).toEqual( [ obj1, obj2 ] );
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