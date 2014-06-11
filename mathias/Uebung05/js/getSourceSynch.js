/**
 * Created by Mathias on 08.06.2014.
 */

function getSourceSynch(url, type)
{
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    return (req.status == 200) ? req.responseText : null;
};
