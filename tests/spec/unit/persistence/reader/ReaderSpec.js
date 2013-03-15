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
			
			
			it( "should extract the records from the property specified by the `dataProperty` config, when the dataProperty config has a literal dot in the property", function() {
				var reader = new ConcreteReader( {
					dataProperty: 'foo\\.bar'
				} );
				
				var records = reader.extractRecords( {
					'foo.bar' : [ obj1, obj2 ]
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
			
			
			it( "should extract the total count from the property specified by the `totalProperty` config, when the `totalProperty` is a dot-delimited path to the property", function() {
				var reader = new ConcreteReader( {
					totalProperty: 'metaData.total'
				} );
				
				var totalCount = reader.extractTotalCount( {
					data : [ obj1, obj2 ],
					
					metaData : { 
						total : 2
					}
				} );
				expect( totalCount ).toBe( 2 );
			} );
			
			
			it( "should extract the total count from the property specified by the `totalProperty` config, when the `totalProperty` has a literal dot in the property name", function() {
				var reader = new ConcreteReader( {
					totalProperty: 'metaData\\.total'
				} );
				
				var totalCount = reader.extractTotalCount( {
					data : [ obj1, obj2 ],
					
					'metaData.total' : 2
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
			
			
			it( "should extract the message from the property specified by the `messageProperty` config, when the `messageProperty` is a dot-delimited path to the property", function() {
				var reader = new ConcreteReader( {
					messageProperty: 'metaData.message'
				} );
				
				var message = reader.extractMessage( {
					data : [ obj1, obj2 ],
					metaData : {
						message : "Test Message"
					}
				} );
				expect( message ).toBe( "Test Message" );
			} );
			
			
			it( "should extract the message from the property specified by the `messageProperty` config, when the `messageProperty` has a literal dot in the property name", function() {
				var reader = new ConcreteReader( {
					messageProperty: 'metaData\\.message'
				} );
				
				var message = reader.extractMessage( {
					data : [ obj1, obj2 ],
					'metaData.message' : "Test Message"
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
		
		
		
		describe( 'applyDataMappings()', function() {
			
			it( "should return the provided object with no modifications if no `dataMappings` config has been specified", function() {
				var reader = new ConcreteReader( {
					// note: no `dataMappings` config
				} );
				
				var rawData      = { 'propA': 1, 'propB': 2 },
				    expectedData = { 'propA': 1, 'propB': 2 };
				expect( reader.applyDataMappings( rawData ) ).toEqual( expectedData );
			} );
			
			
			it( "should apply the mappings specified in the `dataMappings` config, deleting the 'source' properties as it goes along", function() {
				var reader = new ConcreteReader( {
					dataMappings : {
						'propA' : 'targetPropC'
					}
				} );
				
				var rawData      = { 'propA'      : 1, 'propB': 2 },
				    expectedData = { 'targetPropC': 1, 'propB': 2 };
				expect( reader.applyDataMappings( rawData ) ).toEqual( expectedData );
			} );
			
			
			it( "should follow dot-delimited paths in the mapping keys to nested objects, and take the dots literally when they are escaped with a backslash", function() {
				var reader = new ConcreteReader( {
					dataMappings : {
						'propA'                               : 'targetPropA',
						'propB.propC'                         : 'targetPropB',
						'propD\\.propE.propF\\.propG\\.propH' : 'targetPropC',
						
						// Because deleting of used nested mapped properties is not yet implemented, have to
						// remove them manually
						'propB'         : '',
						'propD\\.propE' : ''
					}
				} );
				
				var rawData = { 
					'propA' : 1,
					'propB': {
						'propC' : 2
					},
					'propD.propE' : {
						'propF.propG.propH' : 3
					}
				};
				var expectedData = {
					'targetPropA' : 1,
					'targetPropB' : 2,
					'targetPropC' : 3
				};
				//debugger;
				expect( reader.applyDataMappings( rawData ) ).toEqual( expectedData );
			} );
			
			
			it( "should delete the 'source' properties that are mapped to empty string 'target' property names", function() {
				var reader = new ConcreteReader( {
					dataMappings : {
						'propA' : 'targetPropA',
						
						'propB' : '',
						'propC' : ''
					}
				} );
				
				var rawData = { 
					'propA' : 1, 
					'propB': 2, 
					'propC': 2 
				};
				var expectedData = {
					'targetPropA': 1
				};
				expect( reader.applyDataMappings( rawData ) ).toEqual( expectedData );
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
				},
				
				'h.k' : 6,
				'propL.propM' : 7,
				
				'propN.propO' : {
					'propP' : 8,
					'propQ.propR' : 9,
					'propS.propT.propU' : 10
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
			
			
			it( "should take dots (periods) prefixed with a backslash as literals (i.e. these don't step into a nested object)", function() {
				expect( reader.findPropertyValue( obj, 'h\\.k' ) ).toBe( 6 );
				expect( reader.findPropertyValue( obj, 'propL\\.propM' ) ).toBe( 7 );
				expect( reader.findPropertyValue( obj, 'propN\\.propO.propP' ) ).toBe( 8 );
				expect( reader.findPropertyValue( obj, 'propN\\.propO.propQ\\.propR' ) ).toBe( 9 );
				expect( reader.findPropertyValue( obj, 'propN\\.propO.propS\\.propT\\.propU' ) ).toBe( 10 );
			} );
		} );
		
		
		
		describe( 'parsePathString()', function() {
			var reader;
			beforeEach( function() {
				reader = new ConcreteReader();
			} );
			
			
			it( "should return a single element array if there are no dots in the string", function() {
				expect( reader.parsePathString( 'prop' ) ).toEqual( [ 'prop' ] );
			} );
			
			
			it( "should return an array where each element is the next nested object", function() {
				expect( reader.parsePathString( 'prop.nested' ) ).toEqual( [ 'prop', 'nested' ] );
				expect( reader.parsePathString( 'prop.nested.deepNested' ) ).toEqual( [ 'prop', 'nested', 'deepNested' ] );
			} );
			
			
			it( "should return an array where escaped dots are counted as a single element", function() {
				expect( reader.parsePathString( 'prop\\.notNested' ) ).toEqual( [ 'prop.notNested' ] );
				expect( reader.parsePathString( 'prop\\.notNested\\.stillNotNested' ) ).toEqual( [ 'prop.notNested.stillNotNested' ] );
				
				expect( reader.parsePathString( 'prop.nested\\.notNested' ) ).toEqual( [ 'prop', 'nested.notNested' ] );
				expect( reader.parsePathString( 'prop.nested\\.notNested.nested2' ) ).toEqual( [ 'prop', 'nested.notNested', 'nested2' ] );
				expect( reader.parsePathString( 'prop\\.notNested.nested.nested2' ) ).toEqual( [ 'prop.notNested', 'nested', 'nested2' ] );
			} );
		} );
		
	} );
	
} );