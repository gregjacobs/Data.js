/*global define, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/attribute/Float',
	'data/Model'
], function( FloatAttribute, Model ) {

	describe( "data.attribute.Float", function() {
		
		describe( "Test getDefaultValue()", function() {
			
			it( "getDefaultValue() should return 0 in the default case (i.e. when the `useNull` config is false)", function() {
				var attribute = new FloatAttribute( { name: 'attr', useNull: false } );
				
				expect( attribute.getDefaultValue() ).toBe( 0 );
			} );
			
			
			it( "getDefaultValue() should return null when the `useNull` config is true", function() {
				var attribute = new FloatAttribute( { name: 'attr', useNull: true } );
				
				expect( attribute.getDefaultValue() ).toBe( null );
			} );
			
		} );
		
		
		describe( 'convert()', function() {
			
			it( "should return the appropriate string value when provided a range of values and types, when the useNull config is false", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new FloatAttribute( { name: 'attr', useNull: false } ),
				    oldValue,  // undefined
				    value;
				
				// Test with undefined and null
				value = attribute.convert( undefined );
				expect( value ).toBe( 0 );  // orig YUI Test err msg: "Test with value: undefined"
				
				value = attribute.convert( null );
				expect( value ).toBe( 0 );  // orig YUI Test err msg: "Test with value: null"
				
				
				// Test with booleans
				value = attribute.convert( false );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: false"
				
				value = attribute.convert( true );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: true"
				
				
				// Test with numbers
				value = attribute.convert( 0 );
				expect( value ).toBe( 0 );  // orig YUI Test err msg: "Test with value: 0"
				
				value = attribute.convert( 1 );
				expect( value ).toBe( 1 );  // orig YUI Test err msg: "Test with value: 1"
				
				value = attribute.convert( 1.42 );
				expect( value ).toBe( 1.42 );  // orig YUI Test err msg: "Test with value: 1.42"
				
				
				// Test with actual strings
				value = attribute.convert( "" );
				expect( value ).toBe( 0 );  // orig YUI Test err msg: "Test with value: ''"
				
				value = attribute.convert( "hi" );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: 'hi'"
				
				value = attribute.convert( "true" );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: 'true'"
				
				value = attribute.convert( "1" );
				expect( value ).toBe( 1 );  // orig YUI Test err msg: "Test with value: '1'"
				
				value = attribute.convert( "1.11" );
				expect( value ).toBe( 1.11 );  // orig YUI Test err msg: "Test with value: '1.11'"	
				
				
				// Test with an object
				value = attribute.convert( {} );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: {}"
			} );
			
			
			it( "should return null for 'unparsable' values/types, when the useNull config is true", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new FloatAttribute( { name: 'attr', useNull: true } ),
				    oldValue,  // undefined
				    value;
				
				// Test with undefined and null
				value = attribute.convert( undefined );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: undefined"
				
				value = attribute.convert( null );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: null"
				
				
				// Test with booleans
				value = attribute.convert( false );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: false"
				
				value = attribute.convert( true );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: true"
				
				
				// Test with numbers
				value = attribute.convert( 0 );
				expect( value ).toBe( 0 );  // orig YUI Test err msg: "Test with value: 0"
				
				value = attribute.convert( 1 );
				expect( value ).toBe( 1 );  // orig YUI Test err msg: "Test with value: 1"
				
				value = attribute.convert( 1.42 );
				expect( value ).toBe( 1.42 );  // orig YUI Test err msg: "Test with value: 1.42"
				
				
				// Test with actual strings
				value = attribute.convert( "" );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: ''"
				
				value = attribute.convert( "hi" );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: 'hi'"
				
				value = attribute.convert( "true" );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: 'true'"
				
				value = attribute.convert( "1" );
				expect( value ).toBe( 1 );  // orig YUI Test err msg: "Test with value: '1'"
				
				value = attribute.convert( "1.11" );
				expect( value ).toBe( 1.11 );  // orig YUI Test err msg: "Test with value: '1.11'"
				
				
				// Test with an object
				value = attribute.convert( {} );
				expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "Test with value: {}"
			} );
			
			
			it( "should strip off $, %, and comma (',') characters from an input string, to make a float", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new FloatAttribute( { name: 'attr', useNull: true } ),
				    oldValue,  // undefined
				    value;
				
				value = attribute.convert( "$1,000.32%" );
				expect( value ).toBe( 1000.32 );  // orig YUI Test err msg: "Test with value: $1,000.32%"
			} );
			
		} );
		
	} );
} );