/*global define, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/Model',
	'data/attribute/Date'
], function( Model, DateAttribute ) {
	
	describe( "data.attribute.Date", function() {
		
		describe( 'convert()', function() {
			
			it( "should return null when provided invalid values", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new DateAttribute( { name: 'attr', useNull: false } ),
				    oldValue,  // undefined
				    value;
				
				// Test with undefined and null
				value = attribute.convert( undefined );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: undefined"
				
				value = attribute.convert( null );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: null"
				
				
				// Test with booleans
				value = attribute.convert( false );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: false"
				
				value = attribute.convert( true );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: true"
									
				
				// Test with invalid strings
				value = attribute.convert( "" );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: ''"
				
				value = attribute.convert( "hi" );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: 'hi'"
				
				value = attribute.convert( "true" );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: 'true'"
				
				
				// Test with an object
				value = attribute.convert( {} );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: {}"
				
				// Test with an array
				value = attribute.convert( [] );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: []"
			} );
			
			
			it( "should return a Date object when provided valid values", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new DateAttribute( { name: 'attr', useNull: false } ),
				    oldValue,  // undefined
				    value;
				
				// Test with valid date strings
				value = attribute.convert( "2/22/2012" );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: '2/22/2012'"
				
				// Test with numbers, which are taken to be the number of milliseconds since
				// the Unix epoch (1/1/1970)
				value = attribute.convert( 0 );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: 0"
				
				value = attribute.convert( 1 );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: 1"
				
				value = attribute.convert( 1000 );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: 1000"
				
				// Test with strings that are numbers. These should be converted to a number
				// and assumed to be the number of milliseconds since the Unix epoch (1/1/1970)
				value = attribute.convert( "0" );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: '0'"
				
				value = attribute.convert( "1000" );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: '1000'"
				
				value = attribute.convert( "1000.00" );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: '1000.00'"
				
				
				// Test with a Date object
				var date = new Date( "2/22/2012" );
				value = attribute.convert( date );
				expect( value ).toBe( date );  // orig YUI Test err msg: "Test with actual Date object"
			} );
			
		} );
		
	} );
} );