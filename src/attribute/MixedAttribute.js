/**
 * @class Data.attribute.MixedAttribute
 * @extends Data.attribute.Attribute
 * 
 * Attribute definition class for an Attribute that takes any data value.
 */
/*global Data */
Data.attribute.MixedAttribute = Data.attribute.Attribute.extend( {
		
	// No specific implementation at this time. All handled by the base class Attribute.
	
} );


// Register the Attribute type
Data.attribute.Attribute.registerType( 'mixed', Data.attribute.MixedAttribute );