/*global define, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/Model',
	'data/attribute/Date'
], function( Model, DateAttribute ) {
	
	describe( "unit.attribute.Date", function() {
		
		describe( "Test beforeSet()", function() {
			
			it( "beforeSet() should return null when provided invalid values", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new DateAttribute( { name: 'attr', useNull: false } ),
				    oldValue,  // undefined
				    value;
				
				// Test with undefined and null
				value = attribute.beforeSet( mockModel, undefined, oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: undefined"
				
				value = attribute.beforeSet( mockModel, null, oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: null"
				
				
				// Test with booleans
				value = attribute.beforeSet( mockModel, false, oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: false"
				
				value = attribute.beforeSet( mockModel, true, oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: true"
									
				
				// Test with invalid strings
				value = attribute.beforeSet( mockModel, "", oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: ''"
				
				value = attribute.beforeSet( mockModel, "hi", oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: 'hi'"
				
				value = attribute.beforeSet( mockModel, "true", oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: 'true'"
				
				
				// Test with an object
				value = attribute.beforeSet( mockModel, {}, oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: {}"
				
				// Test with an array
				value = attribute.beforeSet( mockModel, [], oldValue );
				expect( value ).toBe( null );  // orig YUI Test err msg: "Test with value: []"
			} );
			
			
			it( "beforeSet() should return a Date object when provided valid values", function() {
				var mockModel = JsMockito.mock( Model ),
				    attribute = new DateAttribute( { name: 'attr', useNull: false } ),
				    oldValue,  // undefined
				    value;
				
				// Test with valid date strings
				value = attribute.beforeSet( mockModel, "2/22/2012", oldValue );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: '2/22/2012'"
				
				// Test with numbers, which are taken to be the number of milliseconds since
				// the Unix epoch (1/1/1970)
				value = attribute.beforeSet( mockModel, 0, oldValue );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: 0"
				
				value = attribute.beforeSet( mockModel, 1, oldValue );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: 1"
				
				value = attribute.beforeSet( mockModel, 1000, oldValue );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: 1000"
				
				// Test with strings that are numbers. These should be converted to a number
				// and assumed to be the number of milliseconds since the Unix epoch (1/1/1970)
				value = attribute.beforeSet( mockModel, "0", oldValue );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: '0'"
				
				value = attribute.beforeSet( mockModel, "1000", oldValue );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: '1000'"
				
				value = attribute.beforeSet( mockModel, "1000.00", oldValue );
				expect( value instanceof Date ).toBe( true );  // orig YUI Test err msg: "Test with value: '1000.00'"
				
				
				// Test with a Date object
				var date = new Date( "2/22/2012" );
				value = attribute.beforeSet( mockModel, date, oldValue );
				expect( value ).toBe( date );  // orig YUI Test err msg: "Test with actual Date object"
			} );
			
		} );
		
	} );
} );