/**
 * Created by Mathias on 08.06.2014.
 */
// get GL context
function getContext(canvas)
{
    var context = null;
    var validContextNames = ['webgl'];
    var ctxAttribs = {
        alpha: true,
        depth: true,
        antialias: true,
        premultipliedAlpha: false
    };

    for (var i = 0; i < validContextNames.length; i++)
    {
        try
        {
            // provide context name and context creation params
            if (context = canvas.getContext(validContextNames[i], ctxAttribs))
            {
                console.log("Found '" + validContextNames[i] + "' context");
                break;
            }
        } catch (e)
        {
            console.warn(e);
        } // shouldn't happen on modern browsers
    }
    return context;
};