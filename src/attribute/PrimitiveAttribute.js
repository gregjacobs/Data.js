/**
 * @abstract
 * @class Data.attribute.PrimitiveAttribute
 * @extends Data.attribute.Attribute
 * 
 * Base Attribute definition class for an Attribute that holds a JavaScript primitive value 
 * (i.e. A Boolean, Number, or String).
 */
/*global Data */
Data.attribute.PrimitiveAttribute = Data.attribute.Attribute.extend( {
	
	abstractClass: true,
	
	/**
	 * @cfg {Boolean} useNull
	 * True to allow `null` to be set to the Attribute (which is usually used to denote that the 
	 * Attribute is "unset", and it shouldn't take an actual default value).
	 * 
	 * This is also used when parsing the provided value for the Attribute. If this config is true, and the value 
	 * cannot be "easily" parsed into a valid representation of its primitive type, `null` will be used 
	 * instead of converting to the primitive type's default.
	 */
	useNull : false
	
} );